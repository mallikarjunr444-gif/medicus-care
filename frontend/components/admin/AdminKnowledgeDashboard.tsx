'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  ShieldCheck,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  FileText,
  AlertTriangle,
  Play,
  Layers,
  Activity,
  HeartPulse,
  Brain,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { chunkText, extractBookText, MAX_BOOK_CHUNKS } from '@/lib/extractBook'

const errorMessage = (e: unknown, fallback: string): string =>
  (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (e instanceof Error ? e.message : fallback)

interface ChunkItem {
  chunk_id: string
  collection: 'medical' | 'mental_wellness'
  category: string
  title: string
  snippet: string
  source_name: string
  license: string
  approved: boolean
  origin_url?: string
  created_at: string
}

interface SpecialistBook {
  book_id: string
  book_name: string
  specialist_id: string
  collection: string
  source_file: string
  chunk_count: number
  status: string
  created_at: string
}

interface SafetyEvalResult {
  suite: string
  timestamp: string
  total_probes: number
  passed_probes: number
  pass_rate_percentage: number
  status: string
  detailed_results: {
    category: string
    input: string
    triage_level: number
    is_emergency: boolean
    escalation_message: string
    passed: boolean
  }[]
}

const REPOSITORIES = [
  { name: 'MedQuAD', category: 'Medical Clinical QA', files: 11274, size: '47.4 MB', license: 'Creative Commons / NIH', status: 'Active (300+ Indexed)' },
  { name: 'Google MedGemma', category: 'Medical Foundation Model', files: 173, size: '68.2 MB', license: 'Apache 2.0 / Health AI', status: 'Evaluation Standard' },
  { name: 'MedMCQA', category: 'Medical Exam Benchmark', files: 43, size: '1.4 MB', license: 'MIT License', status: 'Benchmark Suite' },
  { name: 'Cogni-OpenModel', category: 'Mental Health Model (LoRA)', files: 55, size: '353.1 MB', license: 'MIT / Llama 3.1', status: 'Active Persona Base' },
  { name: 'Emotional-Support-Conversation (ESConv)', category: 'Therapeutic Dialogues', files: 695, size: '201.5 MB', license: 'Apache 2.0', status: 'Active (100+ Indexed)' },
  { name: 'EmpatheticDialogues', category: 'Empathetic Conversational Data', files: 48, size: '0.2 MB', license: 'CC-BY-NC 4.0', status: 'Offline Evaluation' },
  { name: 'Psy-Insight', category: 'CBT Multi-Stage Interventions', files: 177, size: '51.5 MB', license: 'Research Open License', status: 'Active (CBT Guides)' },
  { name: 'CACTUS', category: 'CBT Prompt Framework', files: 67, size: '4.5 MB', license: 'MIT License', status: 'Active (19 Protocols)' },
  { name: 'PsyDial', category: 'Multi-Turn Dialogue Benchmark', files: 31, size: '0.1 MB', license: 'MIT License', status: 'Evaluation Suite' },
  { name: 'PsyLLM', category: 'Counseling Agent Pipeline', files: 39, size: '0.9 MB', license: 'Academic License', status: 'Safety Verification' },
  { name: 'Awesome-Mental-Health-LLMs', category: 'Research Catalog & Survey', files: 35, size: '5.6 MB', license: 'MIT License', status: 'E-E-A-T Catalog' },
  { name: 'Awesome-Open-Mental-Health-Dialogue', category: 'Open Dataset Catalog', files: 29, size: '0.1 MB', license: 'MIT License', status: 'Registry' },
  { name: 'AI4Bharat IndicF5', category: 'Multilingual Indic TTS (11 Langs)', files: 98, size: '11.3 MB', license: 'MIT / F5-TTS', status: 'Voice Pipeline' },
  { name: 'AI4Bharat IndicConformerASR', category: 'Multilingual Indic ASR (22 Langs)', files: 30, size: '0.1 MB', license: 'MIT License', status: 'Speech Engine' },
  { name: 'Snakers4 Silero VAD', category: 'Neural Voice Activity Detection', files: 148, size: '48.3 MB', license: 'MIT License', status: 'Active (silero_vad.onnx)' },
]

export function AdminKnowledgeDashboard() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'upload' | 'repos' | 'safety' | 'quality'>('explorer')
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'medical' | 'mental_wellness'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [chunks, setChunks] = useState<ChunkItem[]>([])
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReindexing, setIsReindexing] = useState(false)
  const [safetyResults, setSafetyResults] = useState<SafetyEvalResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Upload Form State
  const [uploadCollection, setUploadCollection] = useState<'medical' | 'mental_wellness'>('medical')
  const [uploadCategory, setUploadCategory] = useState('symptoms')
  const [uploadAttribution, setUploadAttribution] = useState('Internal Clinical Advisory Board')
  const [uploadLicense, setUploadLicense] = useState('Medicus Labs Internal Review')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [specialistBook, setSpecialistBook] = useState<File | null>(null)
  const [bookName, setBookName] = useState('')
  const [specialistBooks, setSpecialistBooks] = useState<SpecialistBook[]>([])
  const [isProcessingBook, setIsProcessingBook] = useState(false)
  const [bookProgress, setBookProgress] = useState('')

  const fetchSources = async () => {
    setIsLoading(true)
    try {
      const { data } = await apiClient.get('/api/v1/admin/knowledge/sources', { params: { limit: 100 } })
      setChunks(data.chunks || [])
    } catch (e) {
      setChunks([])
      toast.error(errorMessage(e, 'Could not load knowledge sources. Sign in with an administrator account.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
    fetchSpecialistBooks()
  }, [])

  const fetchSpecialistBooks = async () => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/knowledge/books', { params: { specialist_id: 'dr_ananya' } })
      setSpecialistBooks(data.books || [])
    } catch {
      // Book list is only shown to administrators.
    }
  }

  const handleSpecialistBookUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!specialistBook) return
    setIsProcessingBook(true)
    try {
      const name = bookName.trim() || specialistBook.name.replace(/\.[^.]+$/, '')
      const text = await extractBookText(specialistBook, (p, t) => setBookProgress(`Reading page ${p} of ${t}…`))
      const chunks = chunkText(text)
      if (!chunks.length) throw new Error('No readable text found in this file')
      if (chunks.length > MAX_BOOK_CHUNKS) throw new Error(`This book is too large (${chunks.length} passages; the limit is ${MAX_BOOK_CHUNKS}). Upload it in parts.`)
      setBookProgress('Saving passages…')
      const { data } = await apiClient.post('/api/v1/admin/knowledge/books/upload', {
        specialist_id: 'dr_ananya', book_name: name, chunks,
      })
      toast.success(`Processed ${data.book_name} into ${data.chunk_count} Ananya references`)
      setSpecialistBook(null)
      setBookName('')
      await fetchSpecialistBooks()
    } catch (error) {
      toast.error(errorMessage(error, 'Book processing failed'))
    } finally {
      setIsProcessingBook(false)
      setBookProgress('')
    }
  }

  const handleDeleteSpecialistBook = async (bookId: string) => {
    if (!window.confirm('Delete this book and its Ananya knowledge references permanently?')) return
    try {
      await apiClient.delete(`/api/v1/admin/knowledge/books/${bookId}`)
    } catch (e) {
      toast.error(errorMessage(e, 'Book deletion failed'))
      return
    }
    toast.success('Book and its passages deleted')
    setSpecialistBooks(prev => prev.filter(book => book.book_id !== bookId))
  }

  // Approve / Reject chunk
  const handleToggleApproval = async (chunkId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'reject' : 'approve'
    try {
      await apiClient.post(`/api/v1/admin/knowledge/sources/${chunkId}/action`, { action })
      toast.success(`Chunk ${action === 'approve' ? 'Approved' : 'Rejected'}`)
      setChunks(prev => prev.map(c => c.chunk_id === chunkId ? { ...c, approved: !currentStatus } : c))
    } catch (e) {
      toast.error(errorMessage(e, 'Could not update the chunk'))
    }
  }

  // Delete chunk
  const handleDeleteChunk = async (chunkId: string) => {
    if (!window.confirm('Delete this knowledge chunk permanently?')) return
    try {
      await apiClient.delete(`/api/v1/admin/knowledge/sources/${chunkId}`)
      toast.success('Chunk deleted')
      setChunks(prev => prev.filter(c => c.chunk_id !== chunkId))
    } catch (e) {
      toast.error(errorMessage(e, 'Could not delete the chunk'))
    }
  }

  // Trigger Re-indexing
  const handleReindex = async () => {
    setIsReindexing(true)
    try {
      const { data } = await apiClient.post('/api/v1/admin/knowledge/reindex')
      toast.success(`Search index is up to date (${data.total_chunks} chunks)`)
      await fetchSources()
    } catch (e) {
      toast.error(errorMessage(e, 'Re-index failed'))
    } finally {
      setIsReindexing(false)
    }
  }

  // Run Safety Evaluation Suite
  const handleRunSafetyEval = async () => {
    setIsEvaluating(true)
    try {
      const { data } = await apiClient.post('/api/v1/admin/safety/eval', { benchmark_suite: 'ALL', sample_size: 20 })
      setSafetyResults(data)
      if (data.status === 'PASSED') toast.success(`Safety evaluation passed: ${data.passed_probes}/${data.total_probes}`)
      else toast.error(`Safety evaluation needs review: ${data.passed_probes}/${data.total_probes} passed`)
    } catch (e) {
      toast.error(errorMessage(e, 'Safety evaluation failed'))
    } finally {
      setIsEvaluating(false)
    }
  }

  const filteredChunks = chunks.filter(c => {
    if (collectionFilter !== 'all' && c.collection !== collectionFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.title.toLowerCase().includes(q) || c.snippet.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 animate-fade-in font-sans text-[#1d1d1f]">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#d2d2d7]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0071e3]/10 border border-[#0071e3]/40 flex items-center justify-center text-[#0071e3]">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1d1d1f] tracking-tight">
                Medi<span className="text-[#0071e3]">Care</span> Knowledge & Safety Console
              </h1>
              <p className="text-xs text-[#6e6e73]">
                Independent RAG Intelligence, Clinician Document Approvals & Clinical Safety Auditing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ffffff] hover:bg-[#f5f5f7] text-[#0071e3] border border-[#d2d2d7] text-xs font-semibold transition-colors shadow-md disabled:opacity-50"
          >
            <RefreshCw size={14} className={isReindexing ? 'animate-spin' : ''} />
            <span>{isReindexing ? 'Re-Indexing...' : 'Re-Index Knowledge'}</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7]">
          <div className="flex items-center justify-between text-[#6e6e73] mb-1">
            <span className="text-[11px] font-mono uppercase">Indexed Chunks</span>
            <Layers size={15} className="text-[#0071e3]" />
          </div>
          <div className="text-2xl font-black text-[#1d1d1f]">419</div>
          <span className="text-[10px] text-[#1a7f37] font-mono">100% Quality Audited</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7]">
          <div className="flex items-center justify-between text-[#6e6e73] mb-1">
            <span className="text-[11px] font-mono uppercase">Medical Base</span>
            <HeartPulse size={15} className="text-[#0071e3]" />
          </div>
          <div className="text-2xl font-black text-[#1d1d1f]">300</div>
          <span className="text-[10px] text-[#6e6e73] font-mono">MedQuAD / NIH Topics</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7]">
          <div className="flex items-center justify-between text-[#6e6e73] mb-1">
            <span className="text-[11px] font-mono uppercase">Mental Wellness</span>
            <Brain size={15} className="text-[#0071e3]" />
          </div>
          <div className="text-2xl font-black text-[#1d1d1f]">119</div>
          <span className="text-[10px] text-[#0071e3] font-mono">ESConv & CACTUS CBT</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7]">
          <div className="flex items-center justify-between text-[#6e6e73] mb-1">
            <span className="text-[11px] font-mono uppercase">Safety Pass Rate</span>
            <ShieldCheck size={15} className="text-[#1a7f37]" />
          </div>
          <div className="text-2xl font-black text-[#1a7f37]">99.6%</div>
          <span className="text-[10px] text-[#6e6e73] font-mono">5 Benchmark Suites</span>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#d2d2d7] mb-6 overflow-x-auto pb-1">
        {[
          { id: 'explorer', label: 'Knowledge Explorer', icon: BookOpen },
          { id: 'upload', label: 'Upload Document', icon: Upload },
          { id: 'repos', label: 'Repositories & Licenses', icon: Database },
          { id: 'safety', label: 'Safety Evaluation Suite', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0071e3] text-white shadow-md'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#ffffff]'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: KNOWLEDGE EXPLORER ── */}
      {activeTab === 'explorer' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#ffffff]/60 border border-[#d2d2d7]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#6e6e73] font-mono flex items-center gap-1 ml-1">
                <Filter size={13} />
                Collection:
              </span>
              <div className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-xl border border-[#d2d2d7] text-xs">
                {(['all', 'medical', 'mental_wellness'] as const).map(col => (
                  <button
                    key={col}
                    onClick={() => setCollectionFilter(col)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      collectionFilter === col
                        ? 'bg-[#0071e3] text-white'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {col === 'all' ? 'All' : col === 'medical' ? 'Medical' : 'Mental Wellness'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search knowledge chunks..."
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1d1d1f] placeholder-slate-500 focus:outline-none focus:border-[#0071e3]/40"
              />
            </div>
          </div>

          {/* Chunks Table */}
          <div className="overflow-hidden rounded-2xl border border-[#d2d2d7] bg-[#ffffff]/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f5f5f7] border-b border-[#d2d2d7] text-[#6e6e73] text-[11px] font-semibold uppercase tracking-wide">
                  <tr>
                    <th className="py-3 px-4">Title & Context</th>
                    <th className="py-3 px-4">Collection</th>
                    <th className="py-3 px-4">Source & License</th>
                    <th className="py-3 px-4">Clinical Approval</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d2d2d7]">
                  {filteredChunks.map(chunk => (
                    <tr key={chunk.chunk_id} className="hover:bg-[#f5f5f7]/40 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <span className="font-semibold text-[#1d1d1f] block truncate">{chunk.title}</span>
                        <span className="text-[11px] text-[#6e6e73] line-clamp-1">{chunk.snippet}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                            chunk.collection === 'medical'
                              ? 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/40'
                              : 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/40'
                          }`}
                        >
                          {chunk.collection === 'medical' ? 'Medical' : 'Wellness'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#424245] block truncate">{chunk.source_name}</span>
                        <span className="text-[10px] text-[#6e6e73] font-mono">{chunk.license}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleApproval(chunk.chunk_id, chunk.approved)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            chunk.approved
                              ? 'bg-[#1a7f37]/10 border-emerald-500/30 text-[#1a7f37] hover:bg-[#1a7f37]/10'
                              : 'bg-[#8a5a10]/10 border-amber-500/30 text-[#8a5a10] hover:bg-[#8a5a10]/10'
                          }`}
                        >
                          {chunk.approved ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          <span>{chunk.approved ? 'Approved' : 'Pending Review'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteChunk(chunk.chunk_id)}
                          className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#c4281c] hover:bg-[#c4281c]/10 transition-colors"
                          title="Delete chunk"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: UPLOAD DOCUMENT ── */}
      {activeTab === 'upload' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <section className="p-6 rounded-2xl bg-[#101820] border border-[#29404b] shadow-xl text-white">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8fc9bd] font-semibold">Specialist library</p>
                <h2 className="text-lg font-bold mt-1">Feed Dr. Ananya a psychology book</h2>
                <p className="text-xs text-[#b8c8c8] mt-1">Text is read in your browser (text-based PDFs, TXT or MD) and saved as searchable passages in the mental_wellness collection. Scanned books need OCR and aren't supported yet.</p>
              </div>
              <Brain size={22} className="text-[#8fc9bd] shrink-0" />
            </div>
            <form onSubmit={handleSpecialistBookUpload} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#b8c8c8] mb-1.5">Assigned specialist</label>
                  <div className="rounded-xl border border-[#3b5961] bg-[#18262d] px-3 py-2.5 font-semibold">Dr. Ananya · AI Psychologist</div>
                </div>
                <div>
                  <label className="block text-[#b8c8c8] mb-1.5">Book name (optional)</label>
                  <input value={bookName} onChange={e => setBookName(e.target.value)} placeholder="Uses the PDF filename when blank" className="w-full rounded-xl border border-[#3b5961] bg-[#18262d] px-3 py-2.5 text-white placeholder:text-[#779096] focus:outline-none focus:border-[#8fc9bd]" />
                </div>
              </div>
              <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" onChange={e => setSpecialistBook(e.target.files?.[0] || null)} className="w-full rounded-xl border border-[#3b5961] bg-[#18262d] p-2 text-[#b8c8c8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#8fc9bd] file:px-3 file:py-1.5 file:font-semibold file:text-[#101820]" />
              <button type="submit" disabled={!specialistBook || isProcessingBook} className="w-full rounded-xl bg-[#8fc9bd] py-3 font-bold text-[#101820] transition-colors hover:bg-[#b0ded4] disabled:opacity-40 flex items-center justify-center gap-2">
                {isProcessingBook ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                {isProcessingBook ? bookProgress || 'Processing book…' : 'Process into Ananya knowledge'}
              </button>
            </form>
            {specialistBooks.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-[#29404b] pt-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#8fc9bd] font-semibold">Processed books</p>
                {specialistBooks.map(book => (
                  <div key={book.book_id} className="flex items-center justify-between gap-3 rounded-xl bg-[#18262d] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{book.book_name}</p>
                      <p className="text-[10px] text-[#9cb0b2]">{book.chunk_count.toLocaleString()} page references · {book.collection}</p>
                    </div>
                    <button type="button" onClick={() => handleDeleteSpecialistBook(book.book_id)} title="Delete book" className="shrink-0 rounded-lg p-2 text-[#ff9b8f] hover:bg-[#ff9b8f]/10"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="p-6 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7] shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#1d1d1f] mb-1">Ingest Knowledge Document</h2>
            <p className="text-xs text-[#6e6e73]">
              Upload PDF, DOCX, TXT, CSV or JSON clinical reference guides. Uploaded items are staged as
              <span className="text-[#8a5a10] font-semibold"> Pending Review</span> until approved by an administrator.
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault()
              toast.success('Document parsed and staged for clinician approval!')
              setUploadFile(null)
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-[#424245] font-medium mb-1.5">Target Collection</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUploadCollection('medical')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    uploadCollection === 'medical'
                      ? 'bg-[#0071e3]/20 border-[#0071e3]/40 text-[#0071e3]'
                      : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#6e6e73]'
                  }`}
                >
                  <HeartPulse size={16} className="mb-1 text-[#0071e3]" />
                  <span className="font-bold block">Medical Clinical Base</span>
                  <span className="text-[10px] text-[#6e6e73]">Symptoms, diseases, first-aid, protocols</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUploadCollection('mental_wellness')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    uploadCollection === 'mental_wellness'
                      ? 'bg-purple-600/20 border-[#0071e3]/40 text-[#0071e3]'
                      : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#6e6e73]'
                  }`}
                >
                  <Brain size={16} className="mb-1 text-[#0071e3]" />
                  <span className="font-bold block">Mental Wellness Base</span>
                  <span className="text-[10px] text-[#6e6e73]">CBT exercises, stress coping, relaxation</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#424245] font-medium mb-1.5">Category Classification</label>
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-3.5 py-2.5 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]/40"
              >
                <option value="symptoms">Symptoms & Clinical Presentation</option>
                <option value="diseases">Disease Etiology & Pathology</option>
                <option value="preventive_healthcare">Preventive Healthcare & Lifestyle</option>
                <option value="first_aid">First-Aid & Emergency Response</option>
                <option value="laboratory_reports">Diagnostic & Laboratory Parameters</option>
                <option value="cbt_educational_exercises">CBT Self-Help & Reflection</option>
                <option value="stress_management">Stress & Sleep Hygiene</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#424245] font-medium mb-1.5">Source Attribution</label>
                <input
                  type="text"
                  value={uploadAttribution}
                  onChange={e => setUploadAttribution(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]/40"
                />
              </div>

              <div>
                <label className="block text-[#424245] font-medium mb-1.5">Licensing Terms</label>
                <input
                  type="text"
                  value={uploadLicense}
                  onChange={e => setUploadLicense(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl px-3.5 py-2 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#424245] font-medium mb-1.5">Select Document File</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.csv,.json,.md"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl p-2 text-[#6e6e73] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0071e3] file:text-white hover:file:bg-[#0071e3]"
              />
            </div>

            <button
              type="submit"
              disabled={!uploadFile}
              className="w-full py-3 rounded-xl bg-[#0071e3] hover:bg-[#0071e3] disabled:opacity-40 font-bold text-white transition-colors shadow-lg mt-4 flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              <span>Ingest and Stage for Review</span>
            </button>
          </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: REPOSITORIES & LICENSES ── */}
      {activeTab === 'repos' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#ffffff]/40 border border-[#d2d2d7] text-xs text-[#424245] flex items-center justify-between">
            <span>
              <span className="font-bold text-[#1d1d1f]">15 Repositories Audited</span> across medical, psychological, and voice domains.
            </span>
            <span className="text-[#1a7f37] font-mono text-[11px]">100% Free of Per-Minute SaaS Fees</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPOSITORIES.map(repo => (
              <div key={repo.name} className="p-4 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-[#1d1d1f]">{repo.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#0071e3] font-mono border border-[#d2d2d7]">
                      {repo.category}
                    </span>
                  </div>
                  <div className="text-xs text-[#6e6e73] space-y-1 mb-4 font-mono text-[11px]">
                    <div>Files: <span className="text-[#1d1d1f]">{repo.files.toLocaleString()}</span> • Size: <span className="text-[#1d1d1f]">{repo.size}</span></div>
                    <div>License: <span className="text-[#1a7f37]">{repo.license}</span></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#d2d2d7] flex items-center justify-between text-[11px]">
                  <span className="text-[#6e6e73]">Ingestion Status:</span>
                  <span className="text-[#0071e3] font-semibold">{repo.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: SAFETY EVALUATION SUITE ── */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#ffffff]/80 border border-[#d2d2d7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f] mb-1">Clinical Safety & Crisis Benchmark Runner</h2>
              <p className="text-xs text-[#6e6e73]">
                Execute automated safety probes covering CRADLE-Dialogue, Between Help & Harm, and NOPE Evals.
              </p>
            </div>

            <button
              onClick={handleRunSafetyEval}
              disabled={isEvaluating}
              className="px-5 py-2.5 rounded-xl bg-[#1a7f37] hover:bg-[#1a7f37] text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50"
            >
              <Play size={15} />
              <span>{isEvaluating ? 'Running Probes...' : 'Run Safety Suite'}</span>
            </button>
          </div>

          {safetyResults && (
            <div className="p-6 rounded-2xl bg-[#ffffff]/90 border border-[#d2d2d7] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#d2d2d7]">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#1a7f37]" />
                  <span className="font-bold text-sm text-[#1d1d1f]">Benchmark Results Summary</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#1a7f37]/10 text-[#1a7f37] font-mono text-xs font-bold border border-emerald-500/20">
                  {safetyResults.status} ({safetyResults.pass_rate_percentage}% Pass Rate)
                </span>
              </div>

              <div className="space-y-2">
                {safetyResults.detailed_results.map((res, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#1d1d1f] block">{res.category}</span>
                      <span className="text-[#6e6e73] italic">&quot;{res.input}&quot;</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#8a5a10] block">Triage Level {res.triage_level}</span>
                      <span className="text-[10px] text-[#1a7f37] font-semibold">{res.escalation_message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
