globalThis['ngServerMode'] = true;
import { createRequire } from 'node:module';
globalThis['require'] ??= createRequire(import.meta.url);
import{d as m}from"./chunk-MYXQ7OTZ.mjs";import f from"fetch-blob";import g from"fetch-blob/file.js";function w(o,t=f){var e=`${h()}${h()}`.replace(/\./g,"").slice(-28).padStart(32,"-"),r=[],n=`--${e}\r
Content-Disposition: form-data; name="`;return o.forEach((s,p)=>typeof s=="string"?r.push(n+l(p)+`"\r
\r
${s.replace(/\r(?!\n)|(?<!\r)\n/g,`\r
`)}\r
`):r.push(n+l(p)+`"; filename="${l(s.name,1)}"\r
Content-Type: ${s.type||"application/octet-stream"}\r
\r
`,s,`\r
`)),r.push(`--${e}--`),new t(r,{type:"multipart/form-data; boundary="+e})}var i,c,d,h,y,u,l,a,E,F=m(()=>{"use strict";({toStringTag:i,iterator:c,hasInstance:d}=Symbol),h=Math.random,y="append,set,get,getAll,delete,keys,values,entries,forEach,constructor".split(","),u=(o,t,e)=>(o+="",/^(Blob|File)$/.test(t&&t[i])?[(e=e!==void 0?e+"":t[i]=="File"?t.name:"blob",o),t.name!==e||t[i]=="blob"?new g([t],e,t):t]:[o,t+""]),l=(o,t)=>(t?o:o.replace(/\r?\n|\r/g,`\r
`)).replace(/\n/g,"%0A").replace(/\r/g,"%0D").replace(/"/g,"%22"),a=(o,t,e)=>{if(t.length<e)throw new TypeError(`Failed to execute '${o}' on 'FormData': ${e} arguments required, but only ${t.length} present.`)},E=class{#t=[];constructor(...t){if(t.length)throw new TypeError("Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.")}get[i](){return"FormData"}[c](){return this.entries()}static[d](t){return t&&typeof t=="object"&&t[i]==="FormData"&&!y.some(e=>typeof t[e]!="function")}append(...t){a("append",arguments,2),this.#t.push(u(...t))}delete(t){a("delete",arguments,1),t+="",this.#t=this.#t.filter(([e])=>e!==t)}get(t){a("get",arguments,1),t+="";for(var e=this.#t,r=e.length,n=0;n<r;n++)if(e[n][0]===t)return e[n][1];return null}getAll(t,e){return a("getAll",arguments,1),e=[],t+="",this.#t.forEach(r=>r[0]===t&&e.push(r[1])),e}has(t){return a("has",arguments,1),t+="",this.#t.some(e=>e[0]===t)}forEach(t,e){a("forEach",arguments,1);for(var[r,n]of this)t.call(e,n,r,this)}set(...t){a("set",arguments,2);var e=[],r=!0;t=u(...t),this.#t.forEach(n=>{n[0]===t[0]?r&&(r=!e.push(t)):e.push(n)}),r&&e.push(t),this.#t=e}*entries(){yield*this.#t}*keys(){for(var[t]of this)yield t}*values(){for(var[,t]of this)yield t}}});export{E as a,w as b,F as c};
