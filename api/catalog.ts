import type { VercelRequest,VercelResponse } from '@vercel/node'
import { fail,method } from './_lib/http.js'
import { products } from './_lib/models.js'
import { getConfig } from './_lib/sheets.js'

export default async function handler(req:VercelRequest,res:VercelResponse){if(!method(req,res,['GET']))return;try{const type=String(req.query.type||'varejo')==='atacado'?'atacado':'varejo';const table=await products();const items=table.items.filter((item)=>item.active).map(({raw,rowNumber,order,...item})=>({...item,price:type==='atacado'?(item.wholesalePrice||item.retailPrice):item.retailPrice}));res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');return res.json({type,products:items,whatsapp:process.env.WHATSAPP_NUMBER||await getConfig('whatsapp_number')})}catch(error){return fail(res,error)}}
