import { useState, useEffect, useRef } from 'react';
import ReactMarkdownPkg from 'react-markdown';
import CountUpPkg from 'react-countup';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  const dashboardRef = useRef(null);

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

  const exportPDF = () => {
    const element = dashboardRef.current;
    const opt = {
      margin: 0.5,
      filename: `DORA_${repoName.replace('/', '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
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
    setReport('');
    setExecutiveData(null);
    setLogs([]);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: repoName })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let currentReport = "";
      let buffer = "";

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
                  setLogs(l => [...l, { type: 'tool', text: `⏳ Querying GitHub: ${data.tool}${params}...` }]);
                } else if (data.type === 'tool_end') {
                  setLogs(l => [...l, { type: 'success', text: `✅ Data received from: ${data.tool}` }]);
                } else if (data.type === 'text') {
                  currentReport += data.content;
                  if (!currentReport.includes('---JSON_START---')) {
                    setReport(currentReport);
                  } else {
                    setReport(currentReport.split('---JSON_START---')[0]);
                  }
                } else if (data.type === 'done') {
                  setExecutiveData(data.result.executive_data);
                  setReport(data.result.report);
                  setLogs(l => [...l, { type: 'done', text: '🎉 Analysis completed and saved.' }]);
                  fetchHistory();
                } else if (data.type === 'error') {
                  setLogs(l => [...l, { type: 'error', text: `❌ Error: ${data.content}` }]);
                }
              } catch (parseErr) {
                console.error("JSON parse error on line:", line, parseErr);
              }
            }
          }
        }
      }
    } catch (err) {
      setLogs(l => [...l, { type: 'error', text: `❌ Network failure: ${err.message}` }]);
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
                <span className="hist-date">{item.timestamp.replace(/(\\d{4})(\\d{2})(\\d{2})_(\\d{2})(\\d{2})/, '$3/$2/$1 $4:$5')}</span>
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

              {executiveData.chart_data && executiveData.chart_data.length > 0 && (
                <div className="chart-container results-card">
                  <h3 style={{marginTop:0, color: '#fafafa', fontSize: '1rem', fontWeight: 500}}>Release Trend</h3>
                  <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                      <LineChart data={executiveData.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#a1a1aa" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#a1a1aa" allowDecimals={false} tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', color: '#fafafa' }} itemStyle={{ color: '#fafafa' }} />
                        <Line type="monotone" dataKey="releases" stroke="#fafafa" strokeWidth={2} dot={{ r: 4, fill: '#09090b', stroke: '#fafafa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fafafa' }} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {report && (
            <div className="results-card mt-4">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
