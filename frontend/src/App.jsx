import { useState, useEffect, useRef } from 'react';
import ReactMarkdownPkg from 'react-markdown';
import CountUpPkg from 'react-countup';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, History, Terminal, Loader2, GitBranch } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { jsPDF } from 'jspdf';

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
    
    // 1. Scroll to the very top so dom-to-image doesn't capture a blank off-screen area.
    window.scrollTo(0, 0);
    
    // 2. Hide the main app so it doesn't push the layout down
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    if (mainContent) mainContent.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    
    // 3. Move the PDF container into the visible viewport
    element.classList.add('exporting-active');
    
    try {
      // Give React/Recharts time to render in the visible viewport
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdf = new jsPDF('p', 'px', [800, 1131]); // 1:1.414 A4 ratio in pixels
      
      const capturePage = async (pageId) => {
        const el = document.getElementById(pageId);
        if (!el) return null;
        
        // Force the element to evaluate its height accurately
        const h = el.offsetHeight;
        return {
           img: await domtoimage.toJpeg(el, {
            quality: 0.98,
            bgcolor: '#ffffff',
            width: 800,
            height: h,
            style: { margin: 0, padding: 0 } // Neutralize any external spacing
          }),
          height: h
        };
      };
      
      // PAGE 1: COVER
      const page1 = await capturePage('pdf-page-1');
      if (page1) pdf.addImage(page1.img, 'JPEG', 0, 0, 800, 1131);
      
      // PAGE 2: KPIs & CHARTS
      const page2 = await capturePage('pdf-page-2');
      if (page2) {
        pdf.addPage([800, 1131]);
        pdf.addImage(page2.img, 'JPEG', 0, 0, 800, 1131);
      }
      
      // PAGE 3: DETAILED REPORT
      const page3 = await capturePage('pdf-page-3');
      if (page3) {
        // We use the exact height of the rendered markdown so no text gets cut mid-sentence!
        pdf.addPage([800, page3.height]);
        pdf.addImage(page3.img, 'JPEG', 0, 0, 800, page3.height);
      }
      
      pdf.save(`DORA_Executive_Report_${repoName.replace('/', '_')}.pdf`);
      
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      element.classList.remove('exporting-active');
      if (mainContent) mainContent.style.display = 'block';
      if (sidebar) sidebar.style.display = 'block';
      setIsExporting(false);
    }
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
    
    // Check if the value is a string that contains a number and a unit (e.g. "0.69/day")
    const strVal = String(val);
    const numMatch = strVal.match(/[\d.]+/);
    
    if (numMatch && numMatch[0]) {
      const text = strVal.replace(numMatch[0], '');
      return (
        <>
          {numMatch[0]}
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
          <button onClick={exportPDF} disabled={!executiveData} className={executiveData ? "btn-primary download-pulse" : "btn-secondary"}>
            <Download size={18} /> PDF
          </button>
        </div>

        {/* Persistent Success Badge */}
        {executiveData && !loading && (
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '0.75rem 1.25rem', borderRadius: '9999px', border: '1px solid rgba(74, 222, 128, 0.2)', fontSize: '0.9rem', fontWeight: 500, boxShadow: '0 4px 20px rgba(74, 222, 128, 0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Analysis Successfully Completed. You can now download the PDF report.
          </div>
        )}

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
      <div ref={pdfRef} className="pdf-export-container" style={{ width: '800px', background: '#fff' }}>
        
        {/* PAGE 1: COVER PAGE */}
        <div id="pdf-page-1" style={{ width: '800px', height: '1131px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
          
          <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
             <span style={{ fontSize: '20px', fontWeight: '900', color: '#2563eb', letterSpacing: '1px' }}>DORA <span style={{ color: '#64748b', fontWeight: '400' }}>METRICS AI</span></span>
             <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>Target: {repoName}</span>
          </div>

          <div className="pdf-cover-logo" style={{ marginTop: 'auto' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="pdf-cover-title">EXECUTIVE AUDIT REPORT</h1>
          <h2 className="pdf-cover-subtitle">DevOps Research and Assessment (DORA) Metrics</h2>
          <div className="pdf-cover-divider"></div>
          
          <div className="pdf-cover-details">
            <p className="pdf-cover-label">GENERATED AT</p>
            <p className="pdf-cover-value">{new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          
          <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: 'auto' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Strictly Confidential & Proprietary</p>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} DORA Metrics AI Enterprise. All rights reserved.</p>
          </div>
        </div>

        {/* PAGE 2: KPIs & CHARTS */}
        {executiveData && (
          <div id="pdf-page-2" style={{ width: '800px', height: '1131px', position: 'relative', padding: '100px 40px 60px 40px', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
            
            <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
               <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>DORA <span style={{ color: '#64748b', fontWeight: '400' }}>METRICS AI</span></span>
               <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>Executive Dashboard - Page 2</span>
            </div>

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

            <div className="pdf-charts-grid" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%', pageBreakInside: 'avoid' }}>
              {executiveData.trend_data && executiveData.trend_data.length > 0 && (
                <div className="pdf-chart-container" style={{ flex: '1 1 0', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{marginTop:0, color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>Historical PR Cycle Trend</h3>
                  <div style={{ width: '100%', height: 250 }}>
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
                <div className="pdf-chart-container" style={{ flex: '1 1 0', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{marginTop:0, color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase'}}>DORA Elite Benchmarking Score</h3>
                  <div style={{ width: '100%', height: 250 }}>
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
            
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>© {new Date().getFullYear()} DORA Metrics AI. Confidential.</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>2</span>
            </div>
          </div>
        )}

        {/* PAGE 3: DETAILED REPORT */}
        {report && (
          <div id="pdf-page-3" style={{ width: '800px', minHeight: '1131px', position: 'relative', padding: '100px 40px 80px 40px', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
            
            <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
               <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>DORA <span style={{ color: '#64748b', fontWeight: '400' }}>METRICS AI</span></span>
               <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '700' }}>Analysis Report - Page 3</span>
            </div>

            <div className="pdf-section-title">Detailed Analysis Report</div>
            <div className="pdf-report">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
            
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>© {new Date().getFullYear()} DORA Metrics AI. Confidential.</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
