
import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MapContainer, TileLayer, CircleMarker, Popup, Polygon, useMap} from 'react-leaflet';
import {BarChart3, Trophy, MapPinned, Database, Recycle, RefreshCw, Search, CircleAlert, AlertTriangle, CheckCircle2} from 'lucide-react';
import {loadData, REFRESH_MS, LAGOS_AOI} from './data';
import './index.css';

const categoryColors = {
  'Illegal Dumpsite':'#e85b5b',
  'Overflowing Bins':'#f59e0b'
};
const fallbackColors = ['#00a6c8','#14a56a','#7c5ce6','#ef7d22','#4e8bd8'];

function colorFor(category){
  if(categoryColors[category]) return categoryColors[category];
  let n=0; for(const ch of category) n+=ch.charCodeAt(0);
  return fallbackColors[n%fallbackColors.length];
}

function FitBounds({rows}){
  const map=useMap();
  useEffect(()=>{
    if(rows.length) map.fitBounds(rows.map(r=>[r.lat,r.lon]),{padding:[30,30],maxZoom:12});
  },[rows,map]);
  return null;
}

function titleCaseName(value){
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function firstNameKey(value){
  const cleaned = String(value || '').trim().replace(/\s+/g, ' ');
  return (cleaned.split(' ')[0] || 'unknown submitter').toLowerCase();
}

function getLeaderboard(rows){
  const people = {};

  rows.forEach(r => {
    const rawName = String(r.name || '').trim().replace(/\s+/g, ' ');
    const key = firstNameKey(rawName);

    if(!people[key]){
      people[key] = {
        nameVariants: {},
        submissions: 0,
        uniqueSites: new Set(),
        duplicates: 0,
        errors: 0
      };
    }

    const variantKey = rawName.toLowerCase();
    people[key].nameVariants[variantKey] = (people[key].nameVariants[variantKey] || 0) + 1;
    people[key].submissions += 1;
    if(r.coordinateKey) people[key].uniqueSites.add(r.coordinateKey);
    if(r.duplicate) people[key].duplicates += 1;
    if(r.errors.length) people[key].errors += 1;
  });

  return Object.entries(people)
    .map(([firstName, p]) => {
      // Use the most frequently submitted full-name variant as the display name,
      // then standardise capitalization (e.g. "Abdullahi alamu" -> "Abdullahi Alamu").
      const preferredVariant = Object.entries(p.nameVariants)
        .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || firstName;

      return {
        name: titleCaseName(preferredVariant),
        submissions: p.submissions,
        uniqueSites: p.uniqueSites.size,
        duplicates: p.duplicates,
        errors: p.errors
      };
    })
    .sort((a,b) => b.submissions-a.submissions || b.uniqueSites-a.uniqueSites || a.name.localeCompare(b.name));
}

function App(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [lga,setLga]=useState('All LGAs');
  const [category,setCategory]=useState('All Categories');
  const [search,setSearch]=useState('');
  const [lastUpdated,setLastUpdated]=useState(new Date());
  const [view,setView]=useState('dashboard');

  async function refresh(){
    try{
      setError('');
      const data=await loadData();
      setRows(data);
      setLastUpdated(new Date());
    }catch(e){setError(e.message)}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    refresh();
    const id=setInterval(refresh, REFRESH_MS);
    return ()=>clearInterval(id);
  },[]);

  const lgas=useMemo(()=>['All LGAs',...Array.from(new Set(rows.map(r=>r.lga))).sort()],[rows]);
  const cats=useMemo(()=>['All Categories',...Array.from(new Set(rows.map(r=>r.category))).sort()],[rows]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return rows.filter(r=>
      (lga==='All LGAs'||r.lga===lga) &&
      (category==='All Categories'||r.category===category) &&
      (!q || r.name.toLowerCase().includes(q) || r.lga.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
    );
  },[rows,lga,category,search]);

  const lgaCounts=useMemo(()=>{
    const m={}; filtered.forEach(r=>m[r.lga]=(m[r.lga]||0)+1);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[filtered]);
  const catCounts=useMemo(()=>{
    const m={}; filtered.forEach(r=>m[r.category]=(m[r.category]||0)+1);
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[filtered]);
  const maxLga=Math.max(1,...lgaCounts.map(x=>x[1]));
  const leaderboard=useMemo(()=>getLeaderboard(rows),[rows]);
  const duplicateRows=useMemo(()=>rows.filter(r=>r.duplicate),[rows]);
  const errorRows=useMemo(()=>rows.filter(r=>r.errors.length>0),[rows]);
  const outsideAOIRows=useMemo(()=>rows.filter(r=>!r.inLagosAOI && Number.isFinite(r.lat) && Number.isFinite(r.lon)),[rows]);
  const uniqueSites=useMemo(()=>new Set(rows.map(r=>r.coordinateKey).filter(Boolean)).size,[rows]);

  return <div className="app">
    <aside className="sidebar">
      <div className="brand">
        <img src="/nervs-logo.png" alt="Nervs" />
      </div>
      <nav className="nav">
        <button className={view==='dashboard'?'active':''} onClick={()=>setView('dashboard')}><BarChart3 size={17}/> Dashboard</button>
        <button className={view==='leaderboard'?'active':''} onClick={()=>setView('leaderboard')}><Trophy size={17}/> Leaderboard</button>
      </nav>
      <div className="sidebar-foot">
        <b>Nervs</b><br/>
        Environmental data collection & intelligence.<br/><br/>
        <span>POC • Lagos State waste survey</span>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div>
          <div className="eyebrow">Nervs Environmental Intelligence</div>
          <h1>Waste Incident Dashboard</h1>
          <p className="subtitle">Live spatial view of waste observations collected across Lagos State.</p>
        </div>
        <div className="live"><span className="dot"></span> Live data <span>•</span> Updated {lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
      </header>

      {view==='dashboard' ? <>
      <section className="kpis">
        <Kpi icon={<Database size={18}/>} label="Total Cases" value={filtered.length} note={lga==='All LGAs'&&category==='All Categories'?'All submitted observations':'Matching current filters'}/>
        <Kpi icon={<MapPinned size={18}/>} label="Unique Sites" value={uniqueSites} note={`${duplicateRows.length} records share coordinates`}/>
        <Kpi icon={<CircleAlert size={18}/>} label="Duplicate Submissions" value={duplicateRows.length} note="Same coordinates detected" danger={duplicateRows.length>0}/>
        <Kpi icon={<AlertTriangle size={18}/>} label="Data Errors" value={errorRows.length} note="Missing/invalid fields" danger={errorRows.length>0}/>
        <Kpi icon={<CircleAlert size={18}/>} label="Outside Lagos AOI" value={outsideAOIRows.length} note="Coordinates outside AOI" danger={outsideAOIRows.length>0}/>
      </section>

      <section className="integrity-strip">
        <div><CheckCircle2 size={17}/><b>Submission Integrity</b><span>{uniqueSites.toLocaleString()} unique coordinate sites</span></div>
        <div className={duplicateRows.length?'warn':''}><AlertTriangle size={16}/><b>{duplicateRows.length.toLocaleString()}</b><span>duplicate-coordinate records</span></div>
        <div className={errorRows.length?'warn':''}><AlertTriangle size={16}/><b>{errorRows.length.toLocaleString()}</b><span>records with data errors</span></div>
        <div className={outsideAOIRows.length?'warn':''}><AlertTriangle size={16}/><b>{outsideAOIRows.length.toLocaleString()}</b><span>records outside Lagos AOI</span></div>
      </section>

      <section className="grid">
        <div className="card map-card">
          <div className="section-head">
            <h2>Live Waste Observation Map</h2>
            <span>{filtered.length.toLocaleString()} points displayed</span>
          </div>
          <div className="map-toolbar">
            <select className="control" value={lga} onChange={e=>setLga(e.target.value)}>{lgas.map(x=><option key={x}>{x}</option>)}</select>
            <select className="control" value={category} onChange={e=>setCategory(e.target.value)}>{cats.map(x=><option key={x}>{x}</option>)}</select>
            <div className="control search" style={{display:'flex',alignItems:'center',gap:7}}><Search size={15} color="#78909d"/><input aria-label="Search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, LGA or waste category" style={{border:0,outline:0,width:'100%',background:'transparent'}}/></div>
            <button className="control" onClick={refresh} title="Refresh data"><RefreshCw size={15}/></button>
          </div>
          <div className="map-wrap">
            {error && <div className="empty">{error}</div>}
            {!error && <MapContainer className="map" center={[6.5244,3.3792]} zoom={10} scrollWheelZoom>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <Polygon positions={LAGOS_AOI} pathOptions={{color:'#0b6f86',weight:2,fillColor:'#58b7cc',fillOpacity:0.06,dashArray:'6 6'}}/>
              <FitBounds rows={filtered.filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lon))}/>
              {filtered.filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lon)).map((r)=> <CircleMarker key={r.id} center={[r.lat,r.lon]} radius={r.duplicate||!r.inLagosAOI?9:7} pathOptions={{color:r.duplicate?'#b42318':(!r.inLagosAOI?'#d97706':'#fff'),weight:r.duplicate||!r.inLagosAOI?3:2,fillColor:r.duplicate?'#e85b5b':(!r.inLagosAOI?'#f59e0b':colorFor(r.category)),fillOpacity:.88}}>
                <Popup>
                  <div className="popup">
                    {r.picture ? <img src={r.picture} alt={r.category} onError={(e)=>{e.currentTarget.style.display='none'}}/> : null}
                    <div className="popup-title">{r.category}</div>
                    <div className="popup-meta">Submitted by <b>{r.name}</b></div>
                    {r.duplicate ? <div className="popup-alert">⚠ Duplicate coordinate detected — review this submission.</div> : null}
                    {!r.inLagosAOI ? <div className="popup-alert">⚠ Outside Lagos AOI — review this submission.</div> : null}
                    {r.errors.length ? <div className="popup-alert">⚠ {r.errors.join(' • ')}</div> : null}
                    <div className="popup-grid">
                      <div className="popup-cell"><span>Local Government</span><b>{r.lga}</b></div>
                      <div className="popup-cell"><span>Waste Category</span><b>{r.category}</b></div>
                      <div className="popup-cell"><span>Latitude</span><b>{r.lat.toFixed(6)}</b></div>
                      <div className="popup-cell"><span>Longitude</span><b>{r.lon.toFixed(6)}</b></div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>)}
            </MapContainer>}
            <div className="legend"><div className="legend-title">Waste Category</div>{catCounts.map(([name])=><div className="legend-item" key={name}><span className="legend-dot" style={{background:colorFor(name)}}></span>{name}</div>)}<div className="legend-item"><span className="legend-dot duplicate-dot"></span>Duplicate coordinate</div><div className="legend-item"><span className="legend-dot outside-dot"></span>Outside Lagos AOI</div></div>
            <div className="map-note">© OpenStreetMap contributors</div>
          </div>
        </div>

        <div className="right-col">
          <div className="card chart-card"><div className="section-head"><h2>Cases by Local Government</h2><span>{lgaCounts.length} LGAs</span></div><div className="list">{lgaCounts.length ? lgaCounts.slice(0,10).map(([name,count])=><div className="bar-row" key={name}><div className="bar-label" title={name}>{name}</div><div className="bar-track"><div className="bar-fill" style={{width:`${count/maxLga*100}%`}}/></div><div className="bar-value">{count}</div></div>) : <div className="empty">No matching records.</div>}</div></div>
          <div className="card chart-card"><div className="section-head"><h2>Waste Category Mix</h2><span>{filtered.length} cases</span></div><div className="chart-body"><Donut data={catCounts}/></div></div>
        </div>
      </section>
      </> : <LeaderboardView leaderboard={leaderboard} duplicateRows={duplicateRows} errorRows={errorRows} outsideAOIRows={outsideAOIRows} />}

      <div className="footer-note">Nervs • Waste Data Collection Proof of Concept • Auto-refresh: {Math.round(REFRESH_MS/1000)}s • Leaderboard uses the Name column</div>
    </main>
  </div>
}

function Kpi({icon,label,value,note,danger}){
  return <div className={`card kpi ${danger?'kpi-danger':''}`}><div className="kpi-top"><span>{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value.toLocaleString()}</div><div className="kpi-note">{note}</div></div>
}

function LeaderboardView({leaderboard,duplicateRows,errorRows,outsideAOIRows}){
  const total=leaderboard.reduce((s,p)=>s+p.submissions,0);
  return <section className="leaderboard-page">
    <div className="card leaderboard-hero">
      <div><div className="eyebrow">Field Performance</div><h2>Submission Leaderboard</h2><p>Ranked by the <b>Name</b> column from the survey. Duplicate coordinates and data errors are shown for review.</p></div>
      <div className="leader-stats"><div><b>{leaderboard.length}</b><span>Submitters</span></div><div><b>{total}</b><span>Submissions</span></div><div><b>{duplicateRows.length}</b><span>Duplicate records</span></div><div><b>{outsideAOIRows.length}</b><span>Outside AOI</span></div><div><b>{errorRows.length}</b><span>Error records</span></div></div>
    </div>
    <div className="card leaderboard-card">
      <div className="section-head"><h2>Who is submitting the most?</h2><span>{leaderboard.length} people</span></div>
      <div className="leader-table-wrap">
        <table className="leader-table"><thead><tr><th>Rank</th><th>Name</th><th>Submissions</th><th>Unique Sites</th><th>Duplicate Records</th><th>Errors</th><th>Integrity</th></tr></thead>
        <tbody>{leaderboard.map((p,i)=>{
          const clean=p.duplicates===0 && p.errors===0;
          return <tr key={p.name}><td><span className={`rank rank-${i+1}`}>{i+1}</span></td><td><b>{p.name}</b></td><td className="number">{p.submissions}</td><td className="number">{p.uniqueSites}</td><td className="number">{p.duplicates}</td><td className="number">{p.errors}</td><td><span className={`integrity-badge ${clean?'good':'bad'}`}>{clean?'Clean':'Review'}</span></td></tr>
        })}</tbody></table>
        {!leaderboard.length && <div className="empty">No submissions yet.</div>}
      </div>
    </div>
    <div className="card review-card"><div className="section-head"><h2>Integrity Check</h2><span>Coordinate-based duplicate detection</span></div><div className="review-grid"><div><AlertTriangle size={18}/><b>{duplicateRows.length}</b><span>records sharing coordinates</span></div><div><AlertTriangle size={18}/><b>{errorRows.length}</b><span>records with data errors</span></div><div><AlertTriangle size={18}/><b>{outsideAOIRows.length}</b><span>records outside Lagos AOI</span></div><div><CheckCircle2 size={18}/><b>{leaderboard.filter(p=>p.duplicates===0&&p.errors===0).length}</b><span>submitters with clean records</span></div></div></div>
  </section>
}

function Donut({data}){
  const total=data.reduce((a,[,v])=>a+v,0)||1;
  const radius=62,circ=2*Math.PI*radius;
  let offset=0;
  const colors=data.map(([n])=>colorFor(n));
  return <div style={{display:'flex',alignItems:'center',gap:20,padding:'8px 12px 18px'}}>
    <svg width="155" height="155" viewBox="0 0 155 155" style={{transform:'rotate(-90deg)',flex:'0 0 auto'}}>
      <circle cx="77.5" cy="77.5" r={radius} fill="none" stroke="#edf3f5" strokeWidth="22"/>
      {data.map(([name,value],i)=>{
        const len=circ*(value/total);
        const el=<circle key={name} cx="77.5" cy="77.5" r={radius} fill="none" stroke={colors[i]} strokeWidth="22" strokeDasharray={`${len} ${circ-len}`} strokeDashoffset={-offset}/>;
        offset+=len; return el;
      })}
      <g style={{transform:'rotate(90deg)',transformOrigin:'77.5px 77.5px'}}>
        <text x="77.5" y="73" textAnchor="middle" fontSize="20" fontWeight="800" fill="#10283a">{total}</text>
        <text x="77.5" y="91" textAnchor="middle" fontSize="10" fill="#6c7f8f">TOTAL CASES</text>
      </g>
    </svg>
    <div style={{flex:1}}>
      {data.map(([name,value],i)=><div key={name} style={{display:'flex',justifyContent:'space-between',gap:8,margin:'8px 0',fontSize:11}}>
        <span style={{display:'flex',alignItems:'center',gap:7}}><span className="legend-dot" style={{background:colors[i]}}></span>{name}</span>
        <b>{value}</b>
      </div>)}
    </div>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
