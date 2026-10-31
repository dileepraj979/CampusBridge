import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  CreditCard,
  BookOpen,
  Home,
  Bus,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  Clock,
  Layers,
  MapPin,
  Users,
  ShieldCheck,
  Send,
  RefreshCw,
  Search
} from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import clsx from 'clsx';

const API_BASE = 'http://localhost:5000/api';

export default function CampusOperations() {
  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('finance'); // 'finance' | 'library' | 'hostel_transport' | 'resource_booking'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Finance states
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(35000);

  // Library states
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutBarcode, setCheckoutBarcode] = useState('');

  // Hostel & Transport states
  const [hostelRooms, setHostelRooms] = useState([]);
  const [transportRoutes, setTransportRoutes] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('Aryabhata Hall (Block A)');

  // Resource Booking states
  const [bookings, setBookings] = useState([]);
  const [selectedResource, setSelectedResource] = useState('AUDITORIUM_RAMANUJAN');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 11:00');
  const [bookingPurpose, setBookingPurpose] = useState('');

  useEffect(() => {
    if (activeTab === 'finance') fetchInvoices();
    if (activeTab === 'library') fetchBooks();
    if (activeTab === 'hostel_transport') {
      fetchHostelRooms();
      fetchTransportRoutes();
    }
    if (activeTab === 'resource_booking') fetchBookings();
  }, [activeTab, selectedBlock, selectedDate]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Finance API
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/finance/invoices?rollNo=22CS089`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data || []);
        if (data.data?.length > 0) setSelectedInvoice(data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!selectedInvoice) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/finance/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceNumber: selectedInvoice.invoiceNumber,
          razorpayOrderId: `order_sim_${Date.now()}`,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_success_signature',
          amount: payAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setPaymentModalOpen(false);
        fetchInvoices();
      } else {
        showToast(data.error?.message || 'Payment verification failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 2. Library API
  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      let url = `${API_BASE}/operations/library/books`;
      if (searchQuery) url += `?search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async (barcode) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/library/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ barcode, rollNo: '22CS089' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchBooks();
      } else {
        showToast(data.error?.message || 'Checkout failed', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 3. Hostel & Transport API
  const fetchHostelRooms = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/hostel/rooms?blockName=${encodeURIComponent(selectedBlock)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHostelRooms(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransportRoutes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/transport/routes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransportRoutes(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Resource Booking API
  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/operations/resources/bookings?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookResource = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const resourceNames = {
        AUDITORIUM_RAMANUJAN: 'Ramanujan Grand Auditorium',
        SEMINAR_APJ_HALL: 'Dr. APJ Abdul Kalam Seminar Hall',
        ADV_COMPUTING_LAB: 'NVIDIA AI High-Performance Computing Lab',
        ROBOTICS_RIG: 'IoT & Robotics Prototyping Rig'
      };

      const res = await fetch(`${API_BASE}/operations/resources/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resourceId: selectedResource,
          resourceName: resourceNames[selectedResource],
          date: selectedDate,
          timeSlot: selectedSlot,
          purpose: bookingPurpose || 'Department Academic Session',
          attendeesCount: 45
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setBookingPurpose('');
        fetchBookings();
      } else {
        showToast(data.error?.message || 'Double booking collision rejected', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4',
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
          )}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Campus Operations & Transactional Hub
                <Badge variant="info">Phase 6 Active</Badge>
              </h1>
              <p className="text-xs text-slate-400">
                Finance & scholarships, library inventory, hostel occupancy, transport routes & collision-locked resource booking
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#12141C] border border-white/[0.08] p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab('finance')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'finance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Finance & Invoices
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'library' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Library & Barcodes
          </button>
          <button
            onClick={() => setActiveTab('hostel_transport')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'hostel_transport' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            <Home className="w-3.5 h-3.5" />
            Hostel & Transport
          </button>
          <button
            onClick={() => setActiveTab('resource_booking')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
              activeTab === 'resource_booking' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            )}
          >
            <Lock className="w-3.5 h-3.5" />
            Resource Lock
          </button>
        </div>
      </div>

      {/* 1. FINANCE & SCHOLARSHIPS TAB */}
      {activeTab === 'finance' && selectedInvoice && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Invoice breakdown */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-[#12141C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    Semester {selectedInvoice.semester} Tuition & Autonomous Fee Invoice
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    Student: {selectedInvoice.studentName} ({selectedInvoice.rollNo}) • AIT Autonomous
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={selectedInvoice.status === 'PAID' ? 'success' : 'warning'}>
                    {selectedInvoice.status}
                  </Badge>
                  <div className="text-xs text-slate-400 mt-1">
                    Due: <strong>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* Fee Component Table */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Institutional Fee Structure Breakdown
                </div>
                <div className="divide-y divide-white/[0.06] text-xs">
                  {selectedInvoice.components?.map((c, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <span className="text-slate-300">{c.name}</span>
                      <span className="font-mono text-white font-medium">₹{c.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scholarship Concession Highlight */}
              {selectedInvoice.scholarshipApplied?.concessionAmount > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-300">
                      Scholarship Applied: {selectedInvoice.scholarshipApplied.schemeName}
                    </span>
                    <div className="text-[11px] text-emerald-400/80">Approved by Institutional Review Board</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-300 text-sm">
                    - ₹{selectedInvoice.scholarshipApplied.concessionAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {/* Totals Summary */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-sm">
                <span className="font-bold text-white">Net Payable Amount</span>
                <span className="font-mono text-xl font-extrabold text-white">
                  ₹{selectedInvoice.netPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Installments Timeline */}
            <div className="bg-[#12141C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Installment Schedule & Verified Gateway Payments
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedInvoice.installments?.map((inst, i) => (
                  <div
                    key={i}
                    className={clsx(
                      'p-4 rounded-xl border flex flex-col justify-between space-y-2',
                      inst.status === 'PAID' ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-white/[0.02] border-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-300">
                        Installment {inst.installmentNumber}
                      </span>
                      <Badge variant={inst.status === 'PAID' ? 'success' : 'warning'}>
                        {inst.status}
                      </Badge>
                    </div>
                    <div className="font-mono text-lg font-bold text-white">
                      ₹{inst.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {inst.status === 'PAID' ? `Paid via ${inst.transactionId}` : `Due by ${new Date(inst.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Payment Card */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-indigo-950/40 via-[#12141C] to-purple-950/30 border border-indigo-500/30 rounded-2xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Payment Gateway
                </span>
                <Badge variant="info">256-Bit SSL</Badge>
              </div>

              <div>
                <div className="text-xs text-slate-400">Remaining Balance Due</div>
                <div className="font-mono text-3xl font-extrabold text-white mt-1">
                  ₹{selectedInvoice.dueAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Already Paid: ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}
                </div>
              </div>

              {selectedInvoice.dueAmount > 0 ? (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Installment (₹{selectedInvoice.dueAmount.toLocaleString('en-IN')})
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  All Dues Cleared for Semester {selectedInvoice.semester}
                </div>
              )}

              <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Razorpay Webhook HMAC-SHA256 Server Verified</span>
                </div>
                <div>Instant digital receipts & fee NOC generated on confirmation.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIBRARY SYSTEM TAB */}
      {activeTab === 'library' && (
        <div className="space-y-5">
          {/* Search & Barcode Quick Checkout */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#12141C]/80 border border-white/[0.08] p-4 rounded-2xl">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
                placeholder="Search catalogue by title, author, or ISBN..."
                className="w-full bg-[#090A0F] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="text-xs text-slate-400 font-mono">
                Statutory Loan Window: <strong>14 Days</strong> • Overdue Fine: <strong>₹5/day</strong>
              </div>
            </div>
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {books.map((b) => (
              <div
                key={b._id || b.isbn}
                className="bg-[#12141C]/80 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300">
                      {b.barcode}
                    </span>
                    <Badge variant={b.availableCopies > 0 ? 'success' : 'danger'}>
                      {b.availableCopies > 0 ? `${b.availableCopies}/${b.totalCopies} Available` : 'All Copies Loaned'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-2">{b.title}</h3>
                  <p className="text-xs text-slate-400">By {b.author}</p>
                  
                  <div className="text-[11px] text-slate-500 font-mono pt-1">
                    Location: <strong className="text-slate-300">{b.shelfLocation}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">ISBN: {b.isbn}</span>
                  <button
                    onClick={() => handleCheckout(b.barcode)}
                    disabled={b.availableCopies === 0}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                      b.availableCopies > 0
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    )}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    {b.availableCopies > 0 ? 'Borrow Copy' : 'Join Waitlist'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HOSTEL & TRANSPORT TAB */}
      {activeTab === 'hostel_transport' && (
        <div className="space-y-8">
          {/* Section A: Hostel Occupancy */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-400" />
                  Hostel Room Occupancy & Amenities Matrix
                </h3>
                <p className="text-xs text-slate-400">Real-time floor occupancy, bed assignments & room infrastructure</p>
              </div>

              {/* Block Selector */}
              <div className="flex items-center gap-2">
                {['Aryabhata Hall (Block A)', 'Gargi Bhavan (Block B)'].map((blk) => (
                  <button
                    key={blk}
                    onClick={() => setSelectedBlock(blk)}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      selectedBlock === blk ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {blk}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hostelRooms.map((rm) => (
                <div
                  key={rm._id || rm.roomNumber}
                  className="bg-[#12141C]/80 border border-white/[0.08] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-white">
                      Room {rm.roomNumber}
                    </span>
                    <Badge variant={rm.status === 'OCCUPIED' ? 'danger' : 'success'}>
                      {rm.status} ({rm.occupiedCount}/{rm.capacity})
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400">
                    Floor {rm.floor} • Type: <strong>{rm.roomType.replace('_', ' ')}</strong>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rm.amenities?.map((am, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                        {am}
                      </span>
                    ))}
                  </div>

                  {/* Occupants */}
                  <div className="pt-2 border-t border-white/[0.06] text-xs space-y-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Assigned Occupants:</div>
                    {rm.occupants?.length > 0 ? (
                      rm.occupants.map((occ, i) => (
                        <div key={i} className="text-slate-300 font-mono text-[11px] flex items-center justify-between">
                          <span>{occ.studentName} ({occ.rollNo})</span>
                          <span className="text-slate-500">{occ.bedNumber}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-emerald-400 italic">Beds Available for Allocation</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Transport Route Maps & Capacity Alert */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bus className="w-4 h-4 text-cyan-400" />
              Campus Transport Routes & Seat Capacity Monitors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {transportRoutes.map((rt) => (
                <div
                  key={rt._id || rt.routeNumber}
                  className="bg-[#12141C]/80 border border-white/[0.08] rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                        {rt.routeNumber}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-1">{rt.routeName}</h4>
                    </div>
                    <Badge variant={rt.occupancyStatus === 'NEAR_CAPACITY' ? 'warning' : 'success'}>
                      {rt.occupancyStatus.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Bus & Driver Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#090A0F] p-3 rounded-xl border border-white/[0.06] font-mono">
                    <div>
                      <span className="text-slate-500">Bus Vehicle:</span>
                      <div className="text-slate-200 font-bold">{rt.busNumber}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Capacity Meter:</span>
                      <div className="text-slate-200 font-bold">{rt.allocatedSeats} / {rt.totalCapacity} Seats</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Driver:</span>
                      <div className="text-slate-200">{rt.driverName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Emergency Contact:</span>
                      <div className="text-slate-200">{rt.driverPhone}</div>
                    </div>
                  </div>

                  {/* Stops Timeline */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Scheduled Waypoints & Arrival ETAs:
                    </div>
                    <div className="divide-y divide-white/[0.04] text-xs">
                      {rt.stops?.map((st, i) => (
                        <div key={i} className="py-2 flex items-center justify-between">
                          <span className="text-slate-300 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {st.stopName}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {st.morningPickupTime} / {st.eveningDropTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CAMPUS RESOURCE BOOKING TAB (Transactional Locks) */}
      {activeTab === 'resource_booking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Booking Form */}
          <div className="space-y-5">
            <form onSubmit={handleBookResource} className="bg-[#12141C]/80 border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <Lock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Reserve Campus Resource</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Resource Facility</label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="AUDITORIUM_RAMANUJAN">Ramanujan Grand Auditorium (Capacity: 800)</option>
                  <option value="SEMINAR_APJ_HALL">Dr. APJ Abdul Kalam Seminar Hall (Capacity: 250)</option>
                  <option value="ADV_COMPUTING_LAB">NVIDIA AI High-Performance Computing Lab (Capacity: 60)</option>
                  <option value="ROBOTICS_RIG">IoT & Robotics Prototyping Rig (Capacity: 40)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Booking Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Time Slot (Strict Allocation)</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="09:00 - 11:00">09:00 - 11:00 (Morning Slot A)</option>
                  <option value="11:00 - 13:00">11:00 - 13:00 (Morning Slot B)</option>
                  <option value="14:00 - 16:00">14:00 - 16:00 (Afternoon Slot C)</option>
                  <option value="16:00 - 18:00">16:00 - 18:00 (Evening Slot D)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Academic / Event Purpose</label>
                <textarea
                  required
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  placeholder="e.g. Guest lecture on Distributed Consensus Mechanisms..."
                  rows={3}
                  className="w-full bg-[#090A0F] border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Transactional Collision Guarantee
                </div>
                <div>Server-side atomic index prevents double-booking. Conflicting slots are immediately rejected.</div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wide uppercase shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Reserve Slot with Transactional Lock
              </button>
            </form>
          </div>

          {/* Right 2 Cols: Slot Matrix & Existing Reservations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#12141C]/80 border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Reserved Schedule for {selectedDate}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {bookings.length} Slots Locked
                </span>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div
                      key={b._id || b.bookingId}
                      className="p-4 rounded-xl bg-[#090A0F] border border-white/[0.08] flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            {b.timeSlot}
                          </span>
                          <span className="font-semibold text-white text-xs">{b.resourceName}</span>
                        </div>
                        <div className="text-xs text-slate-400">{b.purpose}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Booked by: {b.bookedByName} ({b.bookedByRole})
                        </div>
                      </div>

                      <Badge variant="success">Confirmed Lock</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 italic">
                  No slots booked yet for {selectedDate}. All facilities open for reservation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SIMULATOR MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Razorpay Checkout Simulation</h3>
              </div>
              <Badge variant="info">Test Gateway</Badge>
            </div>

            <div className="p-4 rounded-xl bg-[#090A0F] border border-white/[0.06] space-y-2">
              <div className="text-xs text-slate-400">Order Ref: {selectedInvoice?.invoiceNumber}</div>
              <div className="font-mono text-2xl font-bold text-white">
                ₹{payAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500">
                Beneficiary: Apex Institute of Technology Autonomous Corpus
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span>Payment Method</span>
                <span className="font-mono text-white">UPI / NetBanking</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span>Server Signature Engine</span>
                <span className="font-mono text-emerald-400">HMAC-SHA256 Active</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatedPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Payment & Sign Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
