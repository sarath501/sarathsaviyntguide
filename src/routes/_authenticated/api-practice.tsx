import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Code2, Copy, FlaskConical, KeyRound, Play, RotateCcw, Search, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/api-practice")({
  head: () => ({ meta: [
    { title: "API Practice Lab | Sarath IGA Learning Portal" },
    { name: "description", content: "Practise illustrative IGA API requests and troubleshoot HTTP errors safely." },
    { property: "og:title", content: "API Practice Lab | Sarath IGA Learning Portal" },
    { property: "og:description", content: "Practise illustrative IGA API requests and troubleshoot HTTP errors safely." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ApiPracticeLab,
});

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = { id: string; title: string; method: Method; path: string; purpose: string; auth: string; params: string; body: string; response: string; notes: string[]; category: string };
type Exercise = { id: number; title: string; level: string; objective: string; task: string; hint: string; endpoint: string; method: Method; expected: string; explanation: string };

const ENDPOINTS: Endpoint[] = [
  { id:"users-list",title:"Search identities",method:"GET",path:"/api/v5/users",purpose:"Illustrative identity search pattern for retrieving users with pagination and filters.",auth:"Bearer token / tenant-approved API authentication",params:"username=alex.morgan\nmax=10\noffset=0",body:"",response:'{\n  "msg": "Success",\n  "userlist": [\n    { "username": "alex.morgan", "firstname": "Alex", "lastname": "Morgan", "statuskey": 1, "departmentname": "Finance" }\n  ],\n  "total": 1\n}',notes:["Use only filters and pagination parameters supported by your tenant's API version.","Protect personal data in logs and exports."],category:"Identity"},
  { id:"user-detail",title:"Retrieve identity details",method:"GET",path:"/api/v5/users/{username}",purpose:"Illustrative pattern for looking up a single identity by a unique identifier.",auth:"Bearer token / tenant-approved API authentication",params:"include=accounts",body:"",response:'{\n  "username": "alex.morgan",\n  "displayname": "Alex Morgan",\n  "email": "alex.morgan@example.test",\n  "departmentname": "Finance",\n  "status": "Active"\n}',notes:["Confirm whether the target API accepts username in the path or expects a query/body parameter.","Avoid exposing attributes the caller is not authorized to read."],category:"Identity"},
  { id:"account-search",title:"Search accounts",method:"GET",path:"/api/v5/accounts",purpose:"Illustrative account search for reviewing accounts associated with an identity or endpoint.",auth:"Bearer token / tenant-approved API authentication",params:"username=alex.morgan\nendpoint=SAP\nmax=20",body:"",response:'{\n  "accounts": [\n    { "accountname": "ALEXM", "username": "alex.morgan", "endpoint": "SAP", "status": "Active" }\n  ],\n  "total": 1\n}',notes:["Account APIs and supported filters vary by Saviynt release and enabled modules.","Distinguish identity records from target-system account records."],category:"Accounts"},
  { id:"request-create",title:"Submit access request",method:"POST",path:"/api/v5/createrequest",purpose:"Illustrative access request submission pattern. Validate exact payload and required fields in your tenant's API documentation.",auth:"Bearer token / tenant-approved API authentication",params:"",body:'{\n  "username": "alex.morgan",\n  "requesttype": "ADD",\n  "endpoint": "SAP",\n  "entitlement": "FINANCE_REPORTS",\n  "comments": "Required for monthly financial reporting"\n}',response:'{\n  "requestid": "REQ-10482",\n  "status": "Pending Approval",\n  "message": "Request submitted"\n}',notes:["A successful API response means the request was accepted, not necessarily approved or provisioned.","Use a unique request reference and business justification."],category:"Access Requests"},
  { id:"request-status",title:"Check request status",method:"GET",path:"/api/v5/getrequeststatus",purpose:"Illustrative request status lookup pattern.",auth:"Bearer token / tenant-approved API authentication",params:"requestid=REQ-10482",body:"",response:'{\n  "requestid": "REQ-10482",\n  "status": "Provisioning",\n  "updatedate": "2026-11-10T09:30:00Z"\n}',notes:["A request can move through multiple states; interpret status values from the tenant's workflow configuration.","Do not assume approval means fulfilment has completed."],category:"Access Requests"},
  { id:"entitlement-search",title:"Search entitlements",method:"GET",path:"/api/v5/entitlements",purpose:"Illustrative pattern for retrieving entitlement catalogue data.",auth:"Bearer token / tenant-approved API authentication",params:"endpoint=SAP\nsearch=FINANCE\nmax=25",body:"",response:'{\n  "entitlements": [\n    { "entitlementname": "FINANCE_REPORTS", "endpoint": "SAP", "displayname": "Finance Reports" }\n  ],\n  "total": 1\n}',notes:["Confirm the endpoint key/name and entitlement attributes available in the target tenant.","Large catalogues should be retrieved with supported pagination."],category:"Entitlements"},
  { id:"account-update",title:"Update account attributes",method:"PUT",path:"/api/v5/updateaccount",purpose:"Illustrative update pattern for a governed account attribute change.",auth:"Bearer token / tenant-approved API authentication",params:"",body:'{\n  "accountname": "ALEXM",\n  "endpoint": "SAP",\n  "attributes": { "department": "Finance" }\n}',response:'{\n  "status": "Accepted",\n  "message": "Update task created",\n  "taskid": "TASK-20914"\n}',notes:["Confirm whether the operation updates a Saviynt account object or invokes a target-system change.","Use least-privilege API permissions and approval controls for write operations."],category:"Accounts"},
  { id:"request-cancel",title:"Cancel access request",method:"DELETE",path:"/api/v5/cancelrequest/{requestId}",purpose:"Illustrative cancellation pattern; cancellation may be restricted by request state and permissions.",auth:"Bearer token / tenant-approved API authentication",params:"",body:'{\n  "reason": "Request no longer required"\n}',response:'{\n  "requestid": "REQ-10482",\n  "status": "Cancellation Requested"\n}',notes:["Cancellation may not be possible after fulfilment or at certain workflow stages.","Confirm exact HTTP method and request format in official API documentation."],category:"Access Requests"}
];

const EXERCISES: Exercise[] = [
  {id:1,title:"Find a user",level:"Beginner",objective:"Retrieve an identity using a unique username.",task:"Choose the identity search endpoint, use GET, and filter for alex.morgan.",hint:"Start with /api/v5/users and add username=alex.morgan as a query parameter.",endpoint:"users-list",method:"GET",expected:"alex.morgan",explanation:"Identity lookup is normally a read operation. Use a unique identifier and limit the result set."},
  {id:2,title:"Retrieve one identity",level:"Beginner",objective:"Select a single identity detail operation.",task:"Use the user detail endpoint and identify the username in the path.",hint:"The path includes a {username} placeholder.",endpoint:"user-detail",method:"GET",expected:"/api/v5/users/alex.morgan",explanation:"A detail lookup should identify one record. Validate path encoding and authorization scope."},
  {id:3,title:"Search an account",level:"Beginner",objective:"Differentiate identity and account records.",task:"Find the SAP account belonging to alex.morgan.",hint:"Use the accounts resource with username and endpoint filters.",endpoint:"account-search",method:"GET",expected:"/api/v5/accounts",explanation:"One identity may have multiple accounts across endpoints. Account search should be scoped to the correct application."},
  {id:4,title:"Submit an access request",level:"Intermediate",objective:"Construct a request with a justification.",task:"Submit an ADD request for FINANCE_REPORTS on SAP for alex.morgan.",hint:"Use POST and include username, requesttype, endpoint, entitlement and comments.",endpoint:"request-create",method:"POST",expected:"FINANCE_REPORTS",explanation:"POST is used for a create/submit operation in this illustrative API exercise. Acceptance does not equal approval or provisioning."},
  {id:5,title:"Track request status",level:"Intermediate",objective:"Track a request through its workflow.",task:"Look up request REQ-10482 and interpret its current state.",hint:"Use the request status resource with requestid=REQ-10482.",endpoint:"request-status",method:"GET",expected:"REQ-10482",explanation:"Request status is a lifecycle state. Provisioning and completion are distinct from submission and approval."},
  {id:6,title:"Search an entitlement",level:"Intermediate",objective:"Locate an entitlement in an application catalogue.",task:"Search the SAP entitlement catalogue for FINANCE_REPORTS.",hint:"Use the entitlement search resource and filter endpoint=SAP.",endpoint:"entitlement-search",method:"GET",expected:"FINANCE_REPORTS",explanation:"Entitlements are application access objects. Use endpoint scope and pagination to narrow results."},
  {id:7,title:"Update account data",level:"Advanced",objective:"Recognize a governed update operation.",task:"Choose the update account operation and use PUT with an account identifier.",hint:"Use /api/v5/updateaccount and identify accountname ALEXM.",endpoint:"account-update",method:"PUT",expected:"ALEXM",explanation:"Write operations require stricter authorization, input validation, approval and audit controls."},
  {id:8,title:"Cancel a request safely",level:"Advanced",objective:"Identify cancellation semantics and state dependency.",task:"Select the cancellation resource and include request REQ-10482.",hint:"Use the cancel request path with the request ID.",endpoint:"request-cancel",method:"DELETE",expected:"REQ-10482",explanation:"Cancellation behavior depends on request state. Do not assume a DELETE always hard-deletes a record."},
  {id:9,title:"Diagnose an unauthorized call",level:"Intermediate",objective:"Interpret an HTTP 401 response.",task:"A call returns 401 Unauthorized. Identify the first checks.",hint:"Check token presence, expiry, issuer/audience and authentication configuration.",endpoint:"users-list",method:"GET",expected:"401",explanation:"401 points to authentication. A 403 usually means the caller is authenticated but lacks permission."},
  {id:10,title:"Handle pagination",level:"Advanced",objective:"Avoid truncating large API result sets.",task:"A search returns 10 rows but total=146. Configure a follow-up page using offset.",hint:"Use max=10 and increase offset from 0 to 10 for the next page.",endpoint:"users-list",method:"GET",expected:"offset=10",explanation:"Pagination prevents oversized responses and incomplete data retrieval. Follow the exact paging contract documented by the API."}
];

const SCENARIOS = [
  {title:"401 Unauthorized",code:401,meaning:"Authentication failed or credentials are missing/invalid.",checks:["Confirm Authorization header format and token presence.","Check token expiry, issuer, audience and clock skew.","Verify the authentication method configured for the API client."],avoid:"Do not paste access tokens into screenshots, tickets or chat."},
  {title:"403 Forbidden",code:403,meaning:"The caller is authenticated but lacks permission for the requested resource or action.",checks:["Verify API user/service account permissions.","Check role, scope and endpoint-level authorization.","Confirm the operation is allowed for this identity and tenant."],avoid:"Do not solve a 403 by granting broad administrator access without review."},
  {title:"400 Bad Request",code:400,meaning:"The server rejected the request syntax, parameters or payload validation.",checks:["Validate JSON syntax and content type.","Check required fields, data types and allowed values.","Compare the payload with the API contract for the tenant release."],avoid:"Do not repeatedly retry an unchanged invalid payload."},
  {title:"404 Not Found",code:404,meaning:"The resource or route could not be found, or the identifier is not resolvable.",checks:["Check base URL, API version and route spelling.","Verify resource identifier and URL encoding.","Confirm the object exists and is visible to the API principal."],avoid:"Do not assume a missing resource means the identity or account should be recreated."},
  {title:"409 Conflict",code:409,meaning:"The request conflicts with current resource state or a duplicate operation.",checks:["Check whether the request was already submitted.","Review current workflow/resource state.","Use idempotency or duplicate prevention if supported."],avoid:"Do not blindly retry create operations that may have succeeded already."},
  {title:"429 Too Many Requests",code:429,meaning:"The API client exceeded a rate limit or throttling threshold.",checks:["Respect Retry-After when provided.","Apply exponential backoff with jitter.","Reduce concurrency and request only required fields."],avoid:"Do not increase request frequency to overcome throttling."},
  {title:"500 / 502 / 503",code:500,meaning:"A server-side or upstream service error occurred.",checks:["Capture timestamp, correlation/request ID and sanitized response.","Check service status and upstream dependency health.","Retry only when operation semantics are safe and policy allows."],avoid:"Never include secrets or full personal data in diagnostic evidence."}
];

const CATEGORIES = ["All", ...Array.from(new Set(ENDPOINTS.map(item=>item.category)))];

function ApiPracticeLab() {
  const [tab,setTab] = useState<"explore"|"workbench"|"exercises"|"errors"|"concepts">("explore");
  const [search,setSearch] = useState("");
  const [category,setCategory] = useState("All");
  const [endpointId,setEndpointId] = useState(ENDPOINTS[0]?.id ?? "");
  const [method,setMethod] = useState<Method>("GET");
  const [path,setPath] = useState(ENDPOINTS[0]?.path ?? "");
  const [params,setParams] = useState(ENDPOINTS[0]?.params ?? "");
  const [body,setBody] = useState(ENDPOINTS[0]?.body ?? "");
  const [auth,setAuth] = useState("Bearer <your-token>");
  const [contentType,setContentType] = useState("application/json");
  const [result,setResult] = useState<{code:number;status:string;body:string;message:string}|null>(null);
  const [exerciseIndex,setExerciseIndex] = useState(0);
  const [answer,setAnswer] = useState("");
  const [completed,setCompleted] = useState<number[]>([]);
  const [feedback,setFeedback] = useState("");
  const [errorIndex,setErrorIndex] = useState(0);
  const endpoint = ENDPOINTS.find(item=>item.id===endpointId) ?? ENDPOINTS[0];
  const exercise = EXERCISES[exerciseIndex];
  const error = SCENARIOS[errorIndex];

  const filtered = useMemo(()=>ENDPOINTS.filter(item=>(category==="All"||item.category===category)&&(item.title+" "+item.purpose+" "+item.path).toLowerCase().includes(search.toLowerCase())),[category,search]);

  function loadEndpoint(id:string) {
    const item=ENDPOINTS.find(e=>e.id===id); if(!item)return;
    setEndpointId(id);setMethod(item.method);setPath(item.path);setParams(item.params);setBody(item.body);setResult(null);
  }
  function runSimulation() {
    if (!endpoint) return;
    if(!path.trim()||!path.startsWith("/")) {setResult({code:400,status:"Bad Request",body:'{"error":"Path must start with /"}',message:"Check the request path."});return;}
    if(method!=="GET"&&body.trim()) {
      try { JSON.parse(body); } catch { setResult({code:400,status:"Bad Request",body:'{"error":"Invalid JSON body"}',message:"The request body is not valid JSON."});return; }
    }
    if(!auth.trim()||auth.includes("<your-token>")) {setResult({code:401,status:"Unauthorized",body:'{"error":"Missing or placeholder authorization token"}',message:"For this simulated exercise, replace the placeholder with any non-secret sample string such as Bearer demo-token."});return;}
    const response=method===endpoint.method?endpoint.response:'{\n  "error": "Method not supported for this illustrative resource",\n  "allowedMethod": "'+endpoint.method+'"\n}';
    const code=method===endpoint.method? (method==="POST"||method==="PUT"?202:200):405;
    setResult({code,status:code===200?"OK":code===202?"Accepted":"Method Not Allowed",body:response,message:code===405?"Choose the method shown in the endpoint catalogue.":code===202?"Simulated request accepted; this is not a real Saviynt operation.":"Simulated response returned from fictional training data."});
  }
  function loadExercise(index:number) {
    const item=EXERCISES[index];if(!item)return;setExerciseIndex(index);setAnswer("");setFeedback("");loadEndpoint(item.endpoint);setTab("workbench");
  }
  function checkExercise() {
    if (!exercise) return;
    const target=exercise.expected.toLowerCase();
    const value=answer.trim().toLowerCase();
    const isCorrect=value.includes(target) || (exercise.id===9 && (value.includes("token")||value.includes("expiry")||value.includes("authentication"))) || (exercise.id===10 && value.includes("offset")&&value.includes("10"));
    if(isCorrect){setCompleted(current=>current.includes(exercise.id)?current:[...current,exercise.id]);setFeedback("Correct. "+exercise.explanation);}
    else setFeedback("Not quite. Hint: "+exercise.hint);
  }
  function copyRequest() {
    const text=`${method} ${path}\nAuthorization: ${auth}\nContent-Type: ${contentType}\n\nQuery parameters:\n${params}\n\n${body}`;
    navigator.clipboard?.writeText(text).catch(()=>{});
  }

  if (!endpoint || !exercise || !error) return <PageHeader title="Saviynt API & Postman Practice Lab" subtitle="Practice content is unavailable." />;

  return <div className="space-y-6">
    <PageHeader title="Saviynt API & Postman Practice Lab" subtitle="Learn REST API fundamentals, explore illustrative Saviynt API patterns, build requests, solve exercises and diagnose HTTP errors."/>
    <div className="grid gap-3 sm:grid-cols-4">
      <Metric label="API patterns" value={ENDPOINTS.length}/>
      <Metric label="Hands-on exercises" value={EXERCISES.length}/>
      <Metric label="Error scenarios" value={SCENARIOS.length}/>
      <Metric label="Exercises completed" value={completed.length}/>
    </div>
    <div className="flex flex-wrap gap-2">{([{id:"explore",label:"API Catalogue",icon:BookOpen},{id:"workbench",label:"Request Workbench",icon:Code2},{id:"exercises",label:"Practice Exercises",icon:FlaskConical},{id:"errors",label:"Error Troubleshooting",icon:ShieldAlert},{id:"concepts",label:"API Fundamentals",icon:KeyRound}] as const).map(item=><button key={item.id} type="button" onClick={()=>setTab(item.id)} className={"rounded-lg border px-3 py-2 text-sm font-medium "+(tab===item.id?"border-primary bg-primary/10 text-primary":"hover:bg-muted")}>{item.label}</button>)}</div>

    {tab==="explore"&&<div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><h2 className="font-semibold">Important API accuracy note</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The routes and payloads below are illustrative learning patterns, not guaranteed copy-paste Saviynt EIC endpoints. API paths, methods, authentication, payload schema and response fields can differ by release, tenant and enabled modules. Always validate against the API documentation supplied for your environment before using a request.</p></div>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users, accounts, requests, entitlements..." className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"/></div><div className="flex flex-wrap gap-2">{CATEGORIES.map(item=><button key={item} onClick={()=>setCategory(item)} className={"rounded-lg border px-3 py-2 text-xs "+(category===item?"border-primary bg-primary/10 text-primary":"hover:bg-muted")}>{item}</button>)}</div></div>
      <div className="grid gap-3 md:grid-cols-2">{filtered.map(item=><div key={item.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.category}</Badge><Badge>{item.method}</Badge></div><h3 className="mt-2 font-semibold">{item.title}</h3><code className="mt-2 block break-all rounded bg-muted p-2 text-xs">{item.path}</code><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.purpose}</p><p className="mt-2 text-xs text-muted-foreground">Auth: {item.auth}</p><button onClick={()=>{loadEndpoint(item.id);setTab("workbench");}} className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">Open in workbench</button></div>)}</div>
      {filtered.length===0&&<p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No API patterns match your search.</p>}
    </div>}

    {tab==="workbench"&&<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5"><div><h2 className="font-semibold">Build an API request</h2><p className="mt-1 text-xs text-muted-foreground">Select a sample resource and edit the request. Execution is simulated locally; no network request is made.</p></div>
        <label className="block text-xs font-medium">Sample endpoint<select value={endpointId} onChange={e=>loadEndpoint(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">{ENDPOINTS.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <div className="grid grid-cols-[110px_1fr] gap-2"><label className="text-xs font-medium">Method<select value={method} onChange={e=>{setMethod(e.target.value as Method);setResult(null);}} className="mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm">{(["GET","POST","PUT","DELETE"] as Method[]).map(item=><option key={item}>{item}</option>)}</select></label><label className="text-xs font-medium">Path<input value={path} onChange={e=>{setPath(e.target.value);setResult(null);}} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-mono text-xs"/></label></div>
        <label className="block text-xs font-medium">Authorization header<input value={auth} onChange={e=>setAuth(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-mono text-xs" placeholder="Bearer demo-token"/></label>
        <label className="block text-xs font-medium">Content-Type<select value={contentType} onChange={e=>setContentType(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"><option>application/json</option><option>application/x-www-form-urlencoded</option></select></label>
        <label className="block text-xs font-medium">Query parameters<textarea value={params} onChange={e=>{setParams(e.target.value);setResult(null);}} rows={3} className="mt-1 w-full rounded-md border bg-background p-3 font-mono text-xs"/></label>
        <label className="block text-xs font-medium">Request body (JSON)<textarea value={body} onChange={e=>{setBody(e.target.value);setResult(null);}} rows={8} className="mt-1 w-full rounded-md border bg-background p-3 font-mono text-xs"/></label>
        <div className="flex flex-wrap gap-2"><button onClick={runSimulation} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Play className="h-4 w-4"/>Send simulated request</button><button onClick={copyRequest} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Copy className="h-4 w-4"/>Copy request</button><button onClick={()=>{loadEndpoint(endpointId);setResult(null);}} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><RotateCcw className="h-4 w-4"/>Reset</button></div>
      </section>
      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Response panel</h2>{result&&<Badge variant={result.code<300?"default":"destructive"}>{result.code} {result.status}</Badge>}</div>
        {result?<><p className="text-sm text-muted-foreground">{result.message}</p><pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6">{result.body}</pre></>:<div className="rounded-xl border border-dashed p-8 text-center"><Code2 className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-2 text-sm font-medium">No response yet</p><p className="mt-1 text-xs text-muted-foreground">Build your request and run the local simulation to see a sample response.</p></div>}
        <div className="rounded-xl bg-muted/50 p-3"><h3 className="text-sm font-semibold">Endpoint notes</h3><ul className="mt-2 space-y-1">{endpoint.notes.map(item=><li key={item} className="text-xs leading-5 text-muted-foreground">• {item}</li>)}</ul></div>
      </section>
    </div>}

    {tab==="exercises"&&<div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"><aside className="space-y-2">{EXERCISES.map((item,index)=><button key={item.id} onClick={()=>{setExerciseIndex(index);setFeedback("");setAnswer("");}} className={"w-full rounded-xl border p-3 text-left "+(index===exerciseIndex?"border-primary bg-primary/5":"hover:bg-muted")}><span className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{item.id}. {item.title}</span>{completed.includes(item.id)&&<CheckCircle2 className="h-4 w-4 text-emerald-600"/>}</span><span className="mt-1 block text-xs text-muted-foreground">{item.level} · {item.objective}</span></button>)}</aside><section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5"><div className="flex items-center gap-2"><Badge>{exercise.level}</Badge><Badge variant="outline">Exercise {exercise.id} / {EXERCISES.length}</Badge></div><h2 className="text-xl font-semibold">{exercise.title}</h2><p className="text-sm text-muted-foreground">{exercise.objective}</p><div className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your task</p><p className="mt-2 text-sm leading-6">{exercise.task}</p></div><button onClick={()=>setFeedback("Hint: "+exercise.hint)} className="text-sm text-primary hover:underline">Show hint</button><label className="block text-xs font-medium">Your answer<input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Enter the path, parameter or key concept..." className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"/></label><div className="flex flex-wrap gap-2"><button onClick={checkExercise} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Check answer</button><button onClick={()=>loadExercise((exerciseIndex+1)%EXERCISES.length)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Open in workbench</button></div>{feedback&&<div className="rounded-xl border bg-muted/50 p-3 text-sm leading-6">{feedback}</div>}<div className="text-xs text-muted-foreground">Progress: {completed.length} / {EXERCISES.length} completed</div></section></div>}

    {tab==="errors"&&<div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]"><aside className="space-y-2">{SCENARIOS.map((item,index)=><button key={item.code} onClick={()=>setErrorIndex(index)} className={"w-full rounded-xl border p-3 text-left "+(index===errorIndex?"border-primary bg-primary/5":"hover:bg-muted")}><span className="font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">HTTP {item.code}</span></button>)}</aside><section className="rounded-2xl border bg-card p-5"><Badge variant="outline">HTTP {error.code}</Badge><h2 className="mt-2 text-xl font-semibold">{error.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{error.meaning}</p><h3 className="mt-5 font-semibold">Diagnostic checklist</h3><ol className="mt-2 space-y-2">{error.checks.map((item,index)=><li key={item} className="flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index+1}</span>{item}</li>)}</ol><div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-sm font-semibold">Avoid</p><p className="mt-1 text-sm text-muted-foreground">{error.avoid}</p></div></section></div>}

    {tab==="concepts"&&<div className="grid gap-4 md:grid-cols-2">{[
      {title:"HTTP methods",text:"GET reads data; POST submits or creates; PUT updates/replaces depending on the API contract; DELETE requests removal or cancellation depending on the resource semantics. Always follow the documented contract."},
      {title:"Authentication vs authorization",text:"Authentication establishes who the API caller is. Authorization determines what that caller may access or change. 401 commonly indicates authentication failure; 403 commonly indicates insufficient permission."},
      {title:"Headers and content type",text:"Authorization carries the approved credential mechanism. Content-Type describes the request body format, commonly application/json for JSON payloads. Never store real secrets in this learning tool."},
      {title:"Pagination and filtering",text:"Use documented filters and page controls to retrieve bounded result sets. Track total counts and avoid assuming the first response contains every record."},
      {title:"Idempotency and retries",text:"A retry of a read request is usually safe. A create request may create duplicates if repeated. Use documented idempotency controls, correlation IDs and state checks where available."},
      {title:"Rate limits and backoff",text:"Respect throttling responses and Retry-After. Apply exponential backoff with jitter, bounded retries and concurrency controls."},
      {title:"HTTP status families",text:"2xx indicates success/acceptance; 3xx redirects; 4xx client/request issues; 5xx server or upstream failures. Interpret the exact status and response body."},
      {title:"Secure API practice",text:"Use a dedicated least-privilege API identity, TLS, secret vaulting, redacted logs, input validation, and non-production testing. Never expose bearer tokens or personal data."}
    ].map(item=><div key={item.title} className="rounded-xl border bg-card p-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div>)}</div>}
    <p className="text-xs text-muted-foreground">Training-only content. All names and payload data are fictional. The workbench returns local sample responses and does not call Saviynt, Postman, or any external API. Validate all API routes, schemas, authentication and permissions against your tenant's official documentation before real use.</p>
  </div>;
}

function Metric({label,value}:{label:string;value:number}) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}
