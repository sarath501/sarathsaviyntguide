import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-auth";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
export const Route=createFileRoute("/_authenticated/community")({
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); },component:Community});
type Topic={id:string;user_id:string;title:string;body:string;category:string;status:string;created_at:string};
type Reply={id:string;topic_id:string;body:string;created_at:string;user_id:string};
function Community(){
 const {user}=useUser();const qc=useQueryClient();const [title,setTitle]=useState("");const [body,setBody]=useState("");const [category,setCategory]=useState("Saviynt");const [active,setActive]=useState<string|null>(null);const [reply,setReply]=useState("");
 const {data:topics=[],isLoading}=useQuery({queryKey:["community-topics"],queryFn:async()=>{const {data,error}=await supabase.from("community_topics").select("id,user_id,title,body,category,status,created_at").order("created_at",{ascending:false}).limit(50);if(error)throw error;return (data??[]) as Topic[]}});
 const {data:replies=[]}=useQuery({queryKey:["community-replies",active],enabled:!!active,queryFn:async()=>{const {data,error}=await supabase.from("community_replies").select("id,topic_id,user_id,body,created_at").eq("topic_id",active!).order("created_at");if(error)throw error;return (data??[]) as Reply[]}});
 async function publish(){if(!user||!title.trim()||!body.trim())return;const {error}=await supabase.from("community_topics").insert({user_id:user.id,title:title.trim(),body:body.trim(),category});if(error){toast.error(error.message);return;}setTitle("");setBody("");await qc.invalidateQueries({queryKey:["community-topics"]});toast.success("Discussion posted");}
 async function respond(){if(!user||!active||!reply.trim())return;const {error}=await supabase.from("community_replies").insert({topic_id:active,user_id:user.id,body:reply.trim()});if(error){toast.error(error.message);return;}setReply("");await qc.invalidateQueries({queryKey:["community-replies",active]});}
 return <div className="space-y-6"><PageHeader title="Learner Community" subtitle="Discuss IGA concepts and share troubleshooting approaches. Never post client names, credentials, personal data or confidential production details."/>
 <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="font-semibold">Start a discussion</h2><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Discussion title"/><select className="h-9 rounded-md border bg-card px-3 text-sm" value={category} onChange={e=>setCategory(e.target.value)}>{["Saviynt","Connectors","Workflows","RBAC & SoD","SQL & Analytics","Interview Preparation","General"].map(x=><option key={x}>{x}</option>)}</select><Textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="Describe the technical question or learning topic…"/><Button onClick={publish} disabled={!title.trim()||!body.trim()}>Publish discussion</Button></section>
 <section className="space-y-3"><h2 className="font-semibold">Recent discussions</h2>{isLoading?<p className="text-sm text-muted-foreground">Loading discussions…</p>:topics.length?topics.map(t=><article key={t.id} className="rounded-xl border bg-card p-4"><button className="w-full text-left" onClick={()=>setActive(active===t.id?null:t.id)}><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{t.title}</h3><Badge variant="secondary">{t.category}</Badge><Badge variant="outline">{t.status}</Badge></div><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{t.body}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p></button>{active===t.id&&<div className="mt-4 space-y-3 border-t pt-4">{replies.map(r=><div key={r.id} className="rounded-lg bg-muted p-3 text-sm">{r.body}<p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div>)}<div className="flex gap-2"><Input value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a helpful reply…"/><Button onClick={respond} disabled={!reply.trim()}>Reply</Button></div></div>}</article>):<p className="rounded-xl border p-5 text-sm text-muted-foreground">No discussions yet. Start the first technical discussion.</p>}</section></div>;
}