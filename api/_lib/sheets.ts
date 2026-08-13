import { google } from 'googleapis'
import { ExternalAccountClient } from 'googleapis-common'
import { getVercelOidcToken } from '@vercel/oidc'

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1zSV7VfxVpT9U1G3RekCwB_GU54j4o3N_onbr3Q9yF4g'
const clean = (value: unknown) => String(value ?? '').trim()
export const normalize = (value: unknown) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
async function client() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim().replace(/\\n/g, '\n')
  let auth
  if (email && key) {
    auth = new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  } else {
    const projectNumber = process.env.GCP_PROJECT_NUMBER?.trim()
    const pool = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID?.trim()
    const provider = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID?.trim()
    if (!email || !projectNumber || !pool || !provider) throw new Error('Federação Google Cloud/Vercel não configurada no servidor.')
    auth = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${pool}/providers/${provider}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${email}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    })
    if (!auth) throw new Error('Não foi possível inicializar a autenticação federada do Google Cloud.')
    auth.scopes = ['https://www.googleapis.com/auth/spreadsheets']
  }
  return google.sheets({ version: 'v4', auth })
}
const quote = (name: string) => `'${name.replace(/'/g, "''")}'`
export async function getRows(sheet: string) {
  const result = await (await client()).spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${quote(sheet)}!A:ZZ` })
  const [rawHeaders = [], ...values] = result.data.values ?? []; const headers = rawHeaders.map(clean)
  return { headers, rows: values.filter((row) => row.some((cell) => clean(cell))).map((row, index) => ({ rowNumber: index + 2, data: Object.fromEntries(headers.map((header, column) => [header, row[column] ?? ''])) })) }
}
export async function ensureSheet(name: string, required: string[]) {
  const sheets = await client()
  const book = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties' })
  const found = book.data.sheets?.some((sheet) => sheet.properties?.title === name)
  if (!found) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: name } } }] } })
    await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${quote(name)}!A1`, valueInputOption: 'RAW', requestBody: { values: [required] } }); return required
  }
  const current = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${quote(name)}!1:1` })
  const headers = (current.data.values?.[0] ?? []).map(clean); const known = new Set(headers.map(normalize)); const additions = required.filter((header) => !known.has(normalize(header)))
  if (additions.length) await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${quote(name)}!${columnName(headers.length + 1)}1`, valueInputOption: 'RAW', requestBody: { values: [additions] } })
  return [...headers, ...additions]
}
export async function appendObject(sheet: string, headers: string[], data: Record<string, unknown>) {
  const entries = new Map(Object.entries(data).map(([key, value]) => [normalize(key), value])); const values = headers.map((header) => entries.get(normalize(header)) ?? '')
  await (await client()).spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${quote(sheet)}!A:ZZ`, valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS', requestBody: { values: [values] } })
}
export async function updateObject(sheet: string, row: number, headers: string[], previous: Record<string, unknown>, patch: Record<string, unknown>) {
  const merged = new Map<string, unknown>(); Object.entries(previous).forEach(([k,v]) => merged.set(normalize(k),v)); Object.entries(patch).forEach(([k,v]) => merged.set(normalize(k),v))
  await (await client()).spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${quote(sheet)}!A${row}:${columnName(headers.length)}${row}`, valueInputOption: 'USER_ENTERED', requestBody: { values: [headers.map((header) => merged.get(normalize(header)) ?? '')] } })
}
export function pick(data: Record<string, unknown>, aliases: string[], fallback: unknown = '') {
  const entries = new Map(Object.entries(data).map(([key,value]) => [normalize(key),value]))
  for (const alias of aliases) {
    const value = entries.get(normalize(alias))
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return fallback
}
export async function getConfig(key: string) { await ensureSheet('Configuracoes', ['Chave','Valor','Atualizado em']); const table = await getRows('Configuracoes'); const row = table.rows.find(({data}) => normalize(pick(data,['Chave','key'])) === normalize(key)); return row ? clean(pick(row.data,['Valor','value'])) : '' }
export async function setConfig(key: string, value: string) { const headers = await ensureSheet('Configuracoes',['Chave','Valor','Atualizado em']); const table = await getRows('Configuracoes'); const row = table.rows.find(({data}) => normalize(pick(data,['Chave','key'])) === normalize(key)); const payload = {Chave:key,Valor:value,'Atualizado em':new Date().toISOString()}; if(row) await updateObject('Configuracoes',row.rowNumber,headers,row.data,payload); else await appendObject('Configuracoes',headers,payload) }
function columnName(position: number) { let value=position,result=''; while(value>0){value--;result=String.fromCharCode(65+value%26)+result;value=Math.floor(value/26)} return result }
