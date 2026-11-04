export function SpectrumArt({compact=false}:{compact?:boolean}) {
 return <svg className={compact?'spectrum-art compact':'spectrum-art'} viewBox="0 0 600 420" role="img" aria-label="Abstract light waves from visible red to near-infrared; conceptual illustration, not measurement data">
 <defs><radialGradient id={compact?'glow-small':'glow'}><stop stopColor="#e5b9a4" stopOpacity=".7"/><stop offset=".6" stopColor="#edc8b8" stopOpacity=".25"/><stop offset="1" stopColor="#edc8b8" stopOpacity="0"/></radialGradient><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#879288" strokeOpacity=".12" strokeWidth=".7"/></pattern></defs>
 <rect width="600" height="420" fill="url(#grid)"/><circle cx="320" cy="211" r="207" fill={`url(#${compact?'glow-small':'glow'})`}/>
 {[55,74,94,114,134,154,174].map((r,i)=><circle key={r} cx="320" cy="211" r={r} fill="none" stroke={i<3?'#a77763':'#8b9589'} strokeWidth=".8" opacity={.5-i*.035}/>)}
 <path d="M28 215 Q55 150 82 215 T136 215 T190 215 T244 215 T298 215 T352 215 T406 215 T460 215 T514 215 T568 215" fill="none" stroke="#9a6250" strokeWidth="1.4"/>
 <path d="M28 215 Q82 161 136 215 T244 215 T352 215 T460 215 T568 215" fill="none" stroke="#6e7e71" strokeWidth="1.1" strokeDasharray="3 5"/>
 <path d="M28 215 H570 M320 30 V385" stroke="#8c9186" strokeWidth=".6" strokeDasharray="2 5"/>
 <circle cx="320" cy="211" r="4" fill="#8b6453"/>
 <g fontFamily="monospace" fontSize="9" fill="#626863" letterSpacing="1"><text x="32" y="44">THE SCIENCE OF LIGHT</text><text x="34" y="370">VISIBLE RED</text><text x="440" y="370">NEAR-INFRARED</text><text x="330" y="72">λ</text><text x="35" y="389">633 nm</text><text x="481" y="389">830 nm</text></g>
 </svg>
}
export function MaskArt({variant=0}:{variant?:number}) {
 const colors=['#e0ddd1','#c8cdc1','#d4c3b1','#b1b7ad'];
 return <svg className="mask-art" viewBox="0 0 300 235" role="img" aria-label="Conceptual LED mask illustration; not a product photograph">
 <defs><linearGradient id={`mask-${variant}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9f8f1"/><stop offset=".6" stopColor={colors[variant%4]}/><stop offset="1" stopColor="#aaa99b"/></linearGradient><filter id={`shadow-${variant}`}><feDropShadow dx="4" dy="13" stdDeviation="10" floodColor="#444a3c" floodOpacity=".16"/></filter></defs>
 <ellipse cx="150" cy="207" rx="65" ry="7" fill="#656953" opacity=".08"/>
 <g transform={`rotate(${[-10,9,-6,7][variant%4]} 150 120)`} filter={`url(#shadow-${variant})`}>
 <path d="M79 61 Q150 24 221 61 L215 140 Q203 187 162 201 Q150 206 138 201 Q97 187 85 140Z" fill={`url(#mask-${variant})`} stroke="#aaa99e" strokeWidth=".7"/>
 <path d="M81 62 Q150 34 219 62" fill="none" stroke="#fff" strokeWidth="3" opacity=".7"/>
 <path d="M99 92 Q116 80 132 92 L130 105 Q114 111 100 103Z M168 92 Q185 80 201 92 L200 103 Q186 111 170 105Z" fill="#656d5e"/>
 <path d="M146 103 L137 139 Q150 148 162 139 L154 104" fill="none" stroke="#a9aa9d" strokeWidth="1.5"/>
 <path d="M130 164 Q150 158 170 164 Q151 177 130 164Z" fill="#858b7c"/>
 <path d="M150 47 V77 M93 120 L119 125 M182 125 L208 120" stroke="#fff" strokeOpacity=".5"/>
 {[76,118,153,185].map(y=><g key={y}><circle cx={y<160?91:119} cy={y} r="1.5" fill="#ba816c"/><circle cx={y<160?209:181} cy={y} r="1.5" fill="#ba816c"/></g>)}
 </g><text x="150" y="229" textAnchor="middle" fontFamily="monospace" fontSize="7" letterSpacing="1.4" fill="#76796c">CONCEPT ILLUSTRATION</text></svg>
}
export function MiniDiagram({type=0}:{type?:number}) {
 return <svg viewBox="0 0 300 140" className="mini-diagram" aria-hidden="true"><path d="M25 107H275 M30 25V107" fill="none" stroke="#c6cbc0"/>{type%2===0?<><path d="M30 76 Q45 34 60 76 T120 76 T180 76 T240 76 T300 76" fill="none" stroke="#a67861" strokeWidth="1.5"/><path d="M30 76 Q60 40 90 76 T210 76 T330 76" fill="none" stroke="#718271" strokeWidth="1.3" strokeDasharray="4 4"/></>:<><path d="M45 95L245 35" stroke="#738570" strokeWidth="1.5"/><path d="M45 95H245V35" fill="#83977d" opacity=".1"/><text x="106" y="73" fontFamily="Georgia" fontSize="22" fill="#66766b">E = P × t</text></>}<text x="225" y="127" fontFamily="monospace" fontSize="8" fill="#767c70">{type%2===0?'WAVELENGTH λ':'EXPOSURE TIME →'}</text></svg>
}
