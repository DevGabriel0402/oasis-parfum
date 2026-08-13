import type { VercelRequest,VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { createSession,clearSession,isAuthenticated,requireAuth } from './_lib/auth.js'
import { fail,method } from './_lib/http.js'
import { getConfig,setConfig } from './_lib/sheets.js'

export default async function handler(req:VercelRequest,res:VercelResponse){
  const action=String(req.query.action||'session')
  try{
    if(action==='session'){if(!method(req,res,['GET']))return;return res.json({authenticated:await isAuthenticated(req)})}
    if(action==='logout'){if(!method(req,res,['POST']))return;clearSession(res);return res.json({ok:true})}
    if(action==='login'){
      if(!method(req,res,['POST']))return; const password=String(req.body?.password||''); if(!password)return res.status(400).json({error:'Informe a senha.'})
      let hash=await getConfig('admin_password_hash')
      if(!hash){const initial=process.env.ADMIN_INITIAL_PASSWORD;if(!initial)throw new Error('Defina ADMIN_INITIAL_PASSWORD para realizar o primeiro acesso.');if(password!==initial)return res.status(401).json({error:'Senha incorreta.'});hash=await bcrypt.hash(password,12);await setConfig('admin_password_hash',hash)}
      else if(!(await bcrypt.compare(password,hash)))return res.status(401).json({error:'Senha incorreta.'})
      await createSession(res);return res.json({ok:true})
    }
    if(action==='password'){
      if(!method(req,res,['PUT'])||!(await requireAuth(req,res)))return;const current=String(req.body?.current||''),next=String(req.body?.next||'');if(next.length<8)return res.status(400).json({error:'A nova senha deve ter ao menos 8 caracteres.'})
      const hash=await getConfig('admin_password_hash');if(!hash||!(await bcrypt.compare(current,hash)))return res.status(401).json({error:'Senha atual incorreta.'});await setConfig('admin_password_hash',await bcrypt.hash(next,12));return res.json({ok:true})
    }
    return res.status(404).json({error:'Ação não encontrada.'})
  }catch(error){return fail(res,error)}
}
