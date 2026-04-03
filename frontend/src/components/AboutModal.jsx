import { useState, useEffect } from 'react'

export default function AboutModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const sections = [
    { label: 'Overview', icon: '◈' },
    { label: 'The Problem', icon: '◉' },
    { label: 'How It Works', icon: '◎' },
    { label: 'Features', icon: '◆' },
    { label: 'Tech Stack', icon: '◇' },
    { label: 'Research', icon: '◈' },
  ]

  const techStack = [
    { layer: 'Frontend', items: ['React 18', 'Tailwind CSS v4', 'TanStack Query', 'Recharts'] },
    { layer: 'Backend', items: ['Node.js', 'Express', 'PostgreSQL', 'PDFKit'] },
    { layer: 'BIM Parser', items: ['Python 3', 'IfcOpenShell', 'Dynamic type discovery'] },
    { layer: 'Deployment', items: ['Vercel (frontend)', 'Render (backend)', 'Supabase (database)'] },
  ]

  const features = [
    { title: 'IFC File Upload', desc: 'Upload any IFC 2x3 or IFC4 file. The system dynamically discovers all physical asset types — no hardcoding required.' },
    { title: 'Smart Asset Extraction', desc: 'Automatically filters out geometry, metadata, and relationships. Only real, maintainable building elements are extracted.' },
    { title: 'Multi-Project Support', desc: 'Manage multiple buildings simultaneously. Each project retains its own assets, work orders and category selections independently.' },
    { title: 'Maintenance Engine', desc: 'Calculates next due dates, flags overdue and due-soon assets automatically. A daily cron job runs checks across all assets.' },
    { title: 'Work Order Generation', desc: 'Auto-generates prioritised work orders for overdue and due-soon assets. High priority for overdue, medium for due soon.' },
    { title: 'Category Configuration', desc: 'Select only the asset categories relevant to your workflow. Each project remembers its own category selection.' },
    { title: 'Analytics Dashboard', desc: 'Visual breakdown of asset health, work order status, assets by category, and key maintenance insights.' },
    { title: 'PDF Export', desc: 'Generate downloadable maintenance reports filtered by project and selected categories.' },
  ]

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-1 rounded-lg font-medium transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        About the app
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full overflow-hidden flex flex-col"
            style={{ maxWidth: '860px', maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 border-b border-gray-100"
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c75 100%)',
              }}
            >
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                borderRadius: '1rem 1rem 0 0'
              }}/>

              <div className="relative flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-xs text-emerald-400 font-medium tracking-widest uppercase">BIM · Facility Management · Full Stack</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                    BIM Preventive Maintenance System
                  </h1>
                  <p className="text-sm text-blue-200 max-w-lg leading-relaxed">
                    A full-stack platform that transforms static BIM models into a living, intelligent maintenance engine — bridging the gap between construction and facility management.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-blue-300 hover:text-white transition-colors ml-4 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav pills */}
              <div className="relative flex gap-1 mt-5 flex-wrap">
                {sections.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSection(i)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                    style={{
                      background: activeSection === i ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: activeSection === i ? '#fff' : 'rgba(255,255,255,0.5)',
                      border: activeSection === i ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    }}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-7">

              {/* Overview */}
              {activeSection === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: '791+', label: 'Assets per model', sub: 'automatically extracted' },
                      { value: '13+', label: 'Asset categories', sub: 'dynamically discovered' },
                      { value: '100%', label: 'IFC compatible', sub: 'IFC2x3 and IFC4' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <p className="text-3xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>{stat.value}</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      The BIM Preventive Maintenance System bridges a critical gap in the Architecture, Engineering and Construction (AEC) industry. While BIM models are heavily used during design and construction, they are typically <strong className="text-gray-900">abandoned once a building is handed over</strong> to facility managers — who then rely on manual logs and spreadsheets.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mt-3">
                      This platform changes that. By parsing real IFC files and extracting building assets automatically, it turns a static 3D model into a <strong className="text-gray-900">living maintenance engine</strong> — tracking every asset, scheduling maintenance before failures occur, and generating work orders automatically.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {['Upload IFC', 'Extract assets', 'Configure categories', 'Run maintenance check', 'Generate work orders', 'Export PDF'].map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                          <span className="w-4 h-4 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0" style={{ fontSize: '10px' }}>{i + 1}</span>
                          <span className="text-xs text-gray-600 whitespace-nowrap">{step}</span>
                        </div>
                        {i < 5 && <span className="text-gray-300 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The Problem */}
              {activeSection === 1 && (
                <div className="space-y-5">
                  <div className="border-l-4 border-gray-800 pl-5 py-1">
                    <p className="text-base font-semibold text-gray-900">In most construction projects, BIM is heavily used during design and construction — then abandoned.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: 'Models are abandoned', desc: 'Once construction ends, the BIM model is handed over and never used again in the operational phase.' },
                      { title: 'Manual and reactive', desc: 'Facility managers rely on Excel spreadsheets and paper logs. Maintenance happens after failure, not before.' },
                      { title: 'Lost asset data', desc: 'Critical information about HVAC units, pumps, generators and electrical panels is disconnected from operations.' },
                      { title: 'High costs', desc: 'Reactive maintenance costs 3–5x more than preventive maintenance. Unexpected failures cause downtime and safety risks.' },
                    ].map((item, i) => (
                      <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-5">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mb-3">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <p className="text-sm font-semibold text-red-900 mb-1">{item.title}</p>
                        <p className="text-xs text-red-700 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-900 text-white rounded-xl p-6">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Industry context</p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      The global Facility Management market exceeds <strong className="text-white">$1 trillion annually</strong>. Studies show 60–80% of a building's lifecycle cost occurs during operation and maintenance. Yet BIM adoption in FM remains below 30% despite widespread use in design and construction.
                    </p>
                  </div>
                </div>
              )}

              {/* How It Works */}
              {activeSection === 2 && (
                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: 'Upload your IFC file',
                      desc: 'Any IFC 2x3 or IFC4 file from Revit, ArchiCAD, Tekla or any BIM authoring tool. The file is saved to the server and a new project is created automatically.',
                      color: 'bg-blue-50 border-blue-100',
                      dot: 'bg-blue-500',
                    },
                    {
                      step: '02',
                      title: 'Dynamic asset discovery',
                      desc: 'A Python script powered by IfcOpenShell scans every entity in the file. It dynamically discovers all physical asset types — excluding geometry, relationships, properties and metadata — leaving only real maintainable elements.',
                      color: 'bg-purple-50 border-purple-100',
                      dot: 'bg-purple-500',
                    },
                    {
                      step: '03',
                      title: 'Configure your categories',
                      desc: 'A modal opens showing all discovered asset categories. Select only the ones relevant to your maintenance workflow. Each project remembers its own selection independently.',
                      color: 'bg-amber-50 border-amber-100',
                      dot: 'bg-amber-500',
                    },
                    {
                      step: '04',
                      title: 'Maintenance engine runs',
                      desc: 'The engine calculates next due dates for every asset based on its last maintenance date and interval. Assets are flagged as healthy, due soon (within 14 days) or overdue.',
                      color: 'bg-green-50 border-green-100',
                      dot: 'bg-green-500',
                    },
                    {
                      step: '05',
                      title: 'Work orders generated',
                      desc: 'Prioritised work orders are auto-generated for all overdue and due-soon assets. High priority for overdue, medium for due soon. Completing a work order updates the asset\'s maintenance date automatically.',
                      color: 'bg-red-50 border-red-100',
                      dot: 'bg-red-500',
                    },
                  ].map((item, i) => (
                    <div key={i} className={`flex gap-5 p-5 rounded-xl border ${item.color}`}>
                      <div className="shrink-0">
                        <span className="text-2xl font-bold text-gray-200" style={{ letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{item.step}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${item.dot}`}></div>
                          <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Features */}
              {activeSection === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  {features.map((f, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all">
                      <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center mb-3">
                        <span className="text-white text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">{f.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tech Stack */}
              {activeSection === 4 && (
                <div className="space-y-4">
                  {techStack.map((layer, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-28 shrink-0 pt-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{layer.layer}</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {layer.items.map((item, j) => (
                          <span key={j} className="text-xs bg-gray-900 text-gray-100 px-3 py-1.5 rounded-lg font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Maintenance intervals</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['MEP / Flow terminals', '90 days'],
                        ['Doors & Windows', '180 days'],
                        ['Roof & Curtain walls', '180 days'],
                        ['Stairs & Railings', '180 days'],
                        ['Furniture & Coverings', '365 days'],
                        ['Structural members', '365 days'],
                        ['Walls & Slabs', '730 days'],
                        ['Custom equipment', '90 days'],
                      ].map(([cat, interval], i) => (
                        <div key={i} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <span className="text-xs text-gray-600">{cat}</span>
                          <span className="text-xs font-semibold text-gray-800 ml-2 shrink-0">{interval}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Research */}
              {activeSection === 5 && (
                <div className="space-y-5">
                  <div className="bg-gray-900 text-white rounded-xl p-6">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Research context</p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      This project directly addresses a documented gap in the AEC industry — the underutilisation of BIM data in the operational phase of a building's lifecycle. It serves as a practical implementation of research topics at the intersection of BIM, Facility Management and Software Engineering.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Research topics supported</p>
                    {[
                      'Improving Facility Management using BIM-based Maintenance Systems',
                      'Integration of BIM and Preventive Maintenance for Lifecycle Efficiency',
                      'Data-driven Asset Management in BIM Environments',
                      'Digital Twins and Smart Buildings in the Built Environment',
                    ].map((topic, i) => (
                      <div key={i} className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="w-1 shrink-0 rounded-full bg-blue-400 self-stretch"></div>
                        <p className="text-sm text-blue-900 font-medium leading-snug">{topic}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Future enhancements</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: 'AI predictive maintenance', desc: 'Predict failure windows from historical maintenance data' },
                        { title: '3D BIM viewer', desc: 'Click an asset to highlight it in the 3D model' },
                        { title: 'User authentication', desc: 'Multi-user support with role-based access control' },
                        { title: 'Mobile app', desc: 'Field technician interface for on-site work order management' },
                        { title: 'Email notifications', desc: 'Alert facility managers before maintenance is due' },
                        { title: 'Speckle integration', desc: 'Real-time BIM data streaming and synchronisation' },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="w-4 h-4 rounded border-2 border-gray-300 shrink-0 mt-0.5"></div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                Built with React · Node.js · Python · PostgreSQL · IfcOpenShell
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
