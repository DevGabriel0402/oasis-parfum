import type { VercelRequest,VercelResponse } from '@vercel/node'
import { requireAuth } from './_lib/auth.js'
import { fail,method } from './_lib/http.js'
import { CATALOG_HEADERS,newId,products } from './_lib/models.js'
import { appendObject,ensureSheet,updateObject } from './_lib/sheets.js'

function payload(body:Record<string,unknown>,id?:string){return {ID:id||newId('PRD'),Produto:body.name,Marca:body.brand,'Descrição':body.description,Imagem:body.image,'Preço Varejo':body.retailPrice,'Preço Atacado':body.wholesalePrice,Estoque:body.stock,Categoria:body.category,Ativo:body.active===false?'Não':'Sim',Destaque:body.featured?'Sim':'Não','Quantidade Mínima Atacado':body.wholesaleMinimum,Slug:body.slug,'Atualizado em':new Date().toISOString()}}
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(!method(req,res,['GET','POST','PUT'])||!(await requireAuth(req,res)))return
  try{const table=await products();if(req.method==='GET')return res.json({products:table.items})
    if(req.method==='POST'){const headers=await ensureSheet('Catálogo',CATALOG_HEADERS);const data=payload(req.body||{});await appendObject('Catálogo',headers,data);return res.status(201).json({product:data})}
    const item=table.items.find((candidate)=>candidate.id===String(req.body?.id));if(!item)return res.status(404).json({error:'Produto não encontrado.'});await updateObject('Catálogo',item.rowNumber,table.headers,item.raw,payload(req.body,item.id));return res.json({ok:true})
  }catch(error){return fail(res,error)}
}
