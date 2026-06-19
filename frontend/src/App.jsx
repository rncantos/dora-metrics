import { useState, useEffect, useRef } from 'react';
import ReactMarkdownPkg from 'react-markdown';
import CountUpPkg from 'react-countup';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, History, Terminal, Loader2, GitBranch } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const CountUp = CountUpPkg.default || CountUpPkg;
const ReactMarkdown = ReactMarkdownPkg.default || ReactMarkdownPkg;
import './index.css';

export default function App() {
  const [repoName, setRepoName] = useState('langchain-ai/langchain');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [executiveData, setExecutiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const dashboardRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    const element = pdfRef.current;
    
    // Give React time to render the overlay before freezing the thread
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Make visible but hidden under the overlay
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '9998'; // Overlay is 9999
    
    const opt = {
      margin: [1, 0.5, 1, 0.5],
      filename: `DORA_Executive_Report_${repoName.replace('/', '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 700, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['.pdf-metric', '.pdf-section-title', 'h1', 'h2', 'h3', 'p', 'li', '.pdf-grid', '.pdf-charts-grid'] }
    };
    
    html2pdf().from(element).set(opt).toPdf().get('pdf').then(function (pdf) {
      const totalPages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 2; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(15, 23, 42);
        pdf.setLineWidth(0.02);
        pdf.line(0.5, 0.8, pageWidth - 0.5, 0.8);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(37, 99, 235);
        pdf.text('DORA', 0.5, 0.65);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text('METRICS AI', 1.25, 0.65);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Executive Audit Report', pageWidth - 0.5, 0.5, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Target: ${repoName}  |  Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`, pageWidth - 0.5, 0.65, { align: 'right' });

        pdf.setDrawColor(226, 232, 240);
        pdf.line(0.5, pageHeight - 0.7, pageWidth - 0.5, pageHeight - 0.7);
        
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`© ${new Date().getFullYear()} DORA Metrics AI. All rights reserved. Highly Confidential Document.`, 0.5, pageHeight - 0.5);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 0.5, pageHeight - 0.5, { align: 'right' });
      }
    }).save().then(() => {
      element.style.display = 'none';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      setTimeout(() => setIsExporting(false), 1500);
    });
  };

  const loadFromHistory = (item) => {
    setRepoName(item.repo_name);
    setReport(item.report);
    setExecutiveData(item.executive_data);
    setLogs([{ type: 'done', text: '✅ Loaded from cache instantly.' }]);
  };

  const analyzeRepo = async () => {
    if (!repoName.trim()) return;
    setLoading(true);
    setShowSuccess(false);
    setReport('');
    setExecutiveData(null);
    setLogs([]);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: repoName })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${await res.text()}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentReport = "";
      let buffer = "";
      let hasFinished = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const line = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');
            
            if (line.trim().startsWith('data: ')) {
              try {
                const data = JSON.parse(line.trim().slice(6));
                
                if (data.type === 'tool_start') {
                  const params = Object.keys(data.inputs || {}).length > 0 ? ` [${JSON.stringify(data.inputs)}]` : '';
                  setLogs(l => [...l, { type: 'tool', text: `⏳ System Task: ${data.tool}${params}...` }]);
                } else if (data.type === 'tool_end') {
                  setLogs(l => [...l, { type: 'success', text: `✅ Component resolved: ${data.tool}` }]);
                } else if (data.type === 'text') {
                  currentReport += data.content;
                  if (!currentReport.includes('---JSON_START---')) {
                    setReport(currentReport);
                  } else {
                    setReport(currentReport.split('---JSON_START---')[0]);
                  }
                } else if (data.type === 'done') {
                  hasFinished = true;
                  setExecutiveData(data.result.executive_data);
                  setReport(data.result.report);
                  setLogs(l => [...l, { type: 'done', text: '🎉 Neural computation finished.' }]);
                  fetchHistory();
                  
                  // Trigger WOW effect
                  setLoading(false);
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                } else if (data.type === 'error') {
                  setLogs(l => [...l, { type: 'error', text: `❌ Engine failure: ${data.content}` }]);
                }
              } catch (parseErr) {
                console.error("JSON parse error on line:", line, parseErr);
              }
            }
          }
        }
      }
      
      // Flush remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          if (data.type === 'done') {
            hasFinished = true;
            setExecutiveData(data.result.executive_data);
            setReport(data.result.report);
            setLogs(l => [...l, { type: 'done', text: '🎉 Neural computation finished.' }]);
            fetchHistory();
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else if (data.type === 'error') {
            alert(`Engine failure: ${data.content}`);
            setLogs(l => [...l, { type: 'error', text: `❌ Engine failure: ${data.content}` }]);
          }
        } catch (e) {
          console.error("Buffer flush parse error", e);
        }
      }
      
      // Safety catch: if stream closed without 'done' event
      if (!hasFinished) {
        if (currentReport.includes('---JSON_START---')) {
           const jsonStr = currentReport.split('---JSON_START---')[1].trim().replace(/```json/g, '').replace(/```/g, '');
           try {
               const parsed = JSON.parse(jsonStr);
               setExecutiveData(parsed);
               setReport(currentReport.split('---JSON_START---')[0]);
               setLogs(l => [...l, { type: 'done', text: '🎉 Neural computation finished (safety catch).' }]);
               fetchHistory();
               setShowSuccess(true);
               setTimeout(() => setShowSuccess(false), 3000);
           } catch (e) {
             console.error('Failed to parse executive data:', e);
             alert("Analysis completed, but the result format was invalid. Please try again.");
           }
        } else {
           // We finished but never got JSON or done event!
           alert("Analysis was interrupted or failed to generate valid metrics. Check the logs.");
        }
      }
      
    } catch (err) {
      setLogs(l => [...l, { type: 'error', text: `❌ Network failure: ${err.message}` }]);
      alert(`Network failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderValue = (val) => {
    if (!val || val === 'N/A') return 'N/A';
    const strVal = String(val);
    const numMatch = strVal.match(/[\\d.]+/);
    if (numMatch && numMatch[0]) {
      const num = parseFloat(numMatch[0]);
      const text = strVal.replace(numMatch[0], '');
      return (
        <>
          <CountUp end={num} decimals={strVal.includes('.') ? 2 : 0} duration={2.5} />
          <span className="unit">{text}</span>
        </>
      );
    }
    return strVal;
  };

  return (
    <div className="app-layout">
      {/* Efecto WOW: PDF Exporting Overlay */}
      {isExporting && (
        <div className="pdf-export-overlay">
          <div className="pdf-export-modal">
            <Loader2 className="spin pdf-spinner" size={48} />
            <h2>Compiling Enterprise Document</h2>
            <p>Rendering vector charts and formatting executive report...</p>
            <div className="pdf-progress-bar">
              <div className="pdf-progress-fill"></div>
            </div>
          </div>
        </div>
      )}

      {/* Efecto WOW: Analysis Success Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon-wrapper">
              <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="success-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="success-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <h2>Analysis Complete</h2>
            <p>DORA Metrics have been successfully generated.</p>
          </div>
        </div>
      )}

      {/* Sidebar Historial */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <History className="icon" />
          <h2>History</h2>
        </div>
        <div className="history-list">
          {history.map((item, i) => (
            <div key={i} className="history-item" onClick={() => loadFromHistory(item)}>
              <GitBranch size={16} />
              <div className="hist-details">
                <span className="hist-repo">{item.repo_name}</span>
                <span className="hist-date">{item.timestamp.replace(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/, '$3/$2/$1 $4:$5')}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && <p className="no-history">No previous analyses.</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="header">
          <h1>DORA Metrics AI</h1>
          <p>Executive Audit with Artificial Intelligence</p>
        </div>

        <div className="action-bar">
          <input 
            type="text" 
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="Owner/Repository (e.g.: facebook/react)"
            onKeyDown={(e) => e.key === 'Enter' && !loading && analyzeRepo()}
          />
          <button onClick={analyzeRepo} disabled={loading} className="btn-primary">
            {loading ? <><Loader2 className="spin" size={18} /> Thinking...</> : '✨ Analyze'}
          </button>
          <button onClick={exportPDF} disabled={!executiveData} className="btn-secondary">
            <Download size={18} /> PDF
          </button>
        </div>

        {/* Terminal en vivo */}
        {(logs.length > 0 || loading) && (
          <div className="terminal-card">
            <div className="terminal-header">
              <Terminal size={14} /> <span>Active Neuro-DevOps Agent</span>
            </div>
            <div className="terminal-body">
              {logs.map((log, i) => (
                <div key={i} className={`log-line ${log.type}`}>{log.text}</div>
              ))}
              {loading && <div className="log-line typing">Generating live insights<span>.</span><span>.</span><span>.</span></div>}
            </div>
          </div>
        )}

        {/* Dashboard Exportable */}
        <div ref={dashboardRef} className="dashboard-export-wrapper">
          
          {/* Skeleton Loaders */}
          {loading && !executiveData && (
            <div className="skeletons executive-dashboard">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          )}

          {executiveData && (
            <>
              <div className="executive-dashboard">
                <div className="metric-card">
                  <div className="metric-title">Deployment Frequency</div>
                  <div className="metric-value">{renderValue(executiveData.df)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">Lead Time</div>
                  <div className="metric-value">{renderValue(executiveData.ltc)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">PR Cycle Time</div>
                  <div className="metric-value">{renderValue(executiveData.pr_cycle_time)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">MTTR</div>
                  <div className="metric-value">{renderValue(executiveData.mttr)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">Failure Rate</div>
                  <div className="metric-value">{renderValue(executiveData.cfr)}</div>
                </div>
              </div>

              <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem', width: '100%' }}>
                {/* Historical PR Trend */}
                {executiveData.trend_data && executiveData.trend_data.length > 0 && (
                  <div className="chart-container results-card">
                    <h3 style={{marginTop:0, color: '#fafafa', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase'}}>Historical PR Cycle Trend</h3>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <LineChart data={executiveData.trend_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="month" stroke="#a1a1aa" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                          <YAxis stroke="#a1a1aa" allowDecimals={false} tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafafa' }} itemStyle={{ color: '#fafafa' }} />
                          <Line type="monotone" dataKey="cycle_time" name="Hours" stroke="#ffffff" strokeWidth={3} dot={{ r: 4, fill: '#000', stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#ffffff' }} animationDuration={1000} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* DORA Benchmarking */}
                {executiveData.chart_data && executiveData.chart_data.length > 0 && (
                  <div className="chart-container results-card">
                    <h3 style={{marginTop:0, color: '#fafafa', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase'}}>DORA Elite Benchmarking Score</h3>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <BarChart data={executiveData.chart_data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                          <XAxis type="number" domain={[0, 100]} stroke="#a1a1aa" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                          <YAxis dataKey="subject" type="category" stroke="#a1a1aa" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} width={80} />
                          <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafafa' }} itemStyle={{ color: '#fafafa' }} />
                          <Bar dataKey="value" name="Score %" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {report && (
            <div className="results-card mt-4">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>

      {/* Hidden Enterprise PDF Template */}
      <div ref={pdfRef} className="pdf-export-container">
        
        {/* COVER PAGE WOW EFFECT */}
        <div className="pdf-cover-page">
          <div className="pdf-cover-logo">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="pdf-cover-title">EXECUTIVE AUDIT REPORT</h1>
          <h2 className="pdf-cover-subtitle">DevOps Research and Assessment (DORA) Metrics</h2>
          <div className="pdf-cover-divider"></div>
          
          <div className="pdf-cover-details">
            <p className="pdf-cover-label">TARGET REPOSITORY</p>
            <p className="pdf-cover-value">{repoName}</p>
            
            <p className="pdf-cover-label">GENERATED AT</p>
            <p className="pdf-cover-value">{new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          
          <div className="pdf-cover-footer">
            <p>Strictly Confidential & Proprietary</p>
            <p>© {new Date().getFullYear()} DORA Metrics AI Enterprise. All rights reserved.</p>
          </div>
        </div>

        <div className="pdf-page-break"></div>

        <div className="pdf-body">
          {executiveData && (
            <>
              <div className="pdf-section-title">Key Performance Indicators</div>
              <div className="pdf-grid">
                <div className="pdf-metric">
                  <div className="pdf-metric-title">Deployment Frequency</div>
                  <div className="pdf-metric-value">{executiveData.df}</div>
                </div>
                <div className="pdf-metric">
                  <div className="pdf-metric-title">Lead Time for Changes</div>
                  <div className="pdf-metric-value">{executiveData.ltc}</div>
                </div>
                <div className="pdf-metric">
                  <div className="pdf-metric-title">PR Cycle Time</div>
                  <div className="pdf-metric-value">{executiveData.pr_cycle_time}</div>
                </div>
                <div className="pdf-metric">
                  <div className="pdf-metric-title">Mean Time to Recovery</div>
                  <div className="pdf-metric-value">{executiveData.mttr}</div>
                </div>
                <div className="pdf-metric">
                  <div className="pdf-metric-title">Change Failure Rate</div>
                  <div className="pdf-metric-value">{executiveData.cfr}</div>
                </div>
              </div>

              {/* PDF Charts Grid */}
              <div className="pdf-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem', width: '100%', pageBreakInside: 'avoid' }}>
                {executiveData.trend_data && executiveData.trend_data.length > 0 && (
                  <div className="pdf-chart-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                    <h3 style={{marginTop:0, color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Historical PR Cycle Trend</h3>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <LineChart data={executiveData.trend_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                          <YAxis stroke="#64748b" allowDecimals={false} tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                          <Line type="monotone" dataKey="cycle_time" name="Hours" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {executiveData.chart_data && executiveData.chart_data.length > 0 && (
                  <div className="pdf-chart-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                    <h3 style={{marginTop:0, color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>DORA Elite Benchmarking Score</h3>
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <BarChart data={executiveData.chart_data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                          <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} />
                          <YAxis dataKey="subject" type="category" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} tickLine={false} width={60} />
                          <Bar dataKey="value" name="Score %" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {report && (
            <>
              <div className="pdf-section-title">Detailed Analysis Report</div>
              <div className="pdf-report">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
