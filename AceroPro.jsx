import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Scale, Flame, Activity, Target, Trash2, CheckCircle2, Clock, Settings, Zap, RotateCcw, PlayCircle, Trophy, Calendar, CheckSquare, Timer, RefreshCw, Info, History, User, Youtube, Play, AlertCircle, Moon, Sun, ChevronRight, X, Dumbbell, HeartPulse, Medal, Droplets, FlaskConical, TrendingUp } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDm_vL1HWR9Fu6fZQZZK_Wvap28HAkePfI",
  authDomain: "aceropro-b6832.firebaseapp.com",
  projectId: "aceropro-b6832",
  storageBucket: "aceropro-b6832.firebasestorage.app",
  messagingSenderId: "1024479446926",
  appId: "1:1024479446926:web:b934d19648ec268b2706df",
  measurementId: "G-4PQY15BY05"
};

// Inicialización global
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rutina-acero-v8-graciela';

const MOTIVATIONAL_QUOTES = [
  "La disciplina te lleva a donde la motivación no alcanza. ¡No te rindas Graciela!",
  "El dolor de hoy es la fuerza de mañana. ¡Sigue adelante, Graciela!",
  "No te detengas hasta que te sientas orgullosa. ¡Tú puedes!",
  "Cada gota de sudor te acerca a tu meta. ¡A darle, Graciela!",
  "Tu cuerpo escucha todo lo que tu mente dice. ¡Mantente fuerte!",
  "El éxito comienza al final de tu zona de confort.",
  "La motivación te hace empezar, el hábito te mantiene en marcha.",
  "No busques excusas, busca resultados. ¡A por todas, Graciela!",
  "Recuerda por qué empezaste. ¡No bajes la guardia!",
  "Si no te desafía, no te cambia. ¡Vamos con todo!"
];

// Helper para sobrecarga progresiva
const getProgressedStats = (baseS, baseR, level) => {
    const extraSets = Math.floor((level - 1) / 3);
    const extraReps = ((level - 1) % 3) * 2;
    const finalSets = baseS + extraSets;
    let finalReps = baseR;
    if (typeof baseR === 'string') {
        if (baseR.toLowerCase() === "fallo") finalReps = "Fallo";
        else if (baseR.includes("s")) finalReps = (parseInt(baseR) + extraReps * 5) + "s";
        else if (baseR.includes("p/l")) finalReps = (parseInt(baseR) + extraReps) + " p/l";
        else finalReps = (parseInt(baseR) + extraReps).toString();
    }
    return { s: finalSets, r: finalReps };
};

export default function App() {
  // 1. TODOS LOS HOOKS AL PRINCIPIO
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lun');
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [calories, setCalories] = useState(0);
  const [customCalories, setCustomCalories] = useState("");
  const [previewExercise, setPreviewExercise] = useState(null); 
  const [habits, setHabits] = useState({ water: false, creatine: false, protein: false });
  const [completedSets, setCompletedSets] = useState({});
  const [completedCardio, setCompletedCardio] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [cardioTimer, setCardioTimer] = useState(45);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); 
  const [fastingStart, setFastingStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [fastingGoal, setFastingGoal] = useState(16);

  const [profile, setProfile] = useState({
    name: "Graciela Arredondo",
    initialWeight: 85,
    currentWeight: 85,
    targetWeight: 60,
    lastWeightUpdate: null,
    startDate: Date.now(),
    dailyVideos: { lun: "", mar: "", mie: "", jue: "", vie: "", sab: "", dom: "" }
  });

  // Cálculo de nivel (movido arriba para evitar ReferenceError)
  const currentMonthLevel = useMemo(() => {
    if (!profile.startDate) return 1;
    const daysActive = Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24));
    return Math.floor(daysActive / 30) + 1;
  }, [profile.startDate]);

  // Definición de rutina
  const workout = useMemo(() => ({
    lun: { name: "Pecho y Tríceps", exs: [
      { n: "Press Pecho Banco", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69c9a5312a12237b48ed23fb.png" },
      { n: "Aperturas Mancuernas", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca087e8d4292c2b2e5912c.png" },
      { n: "Press Banca Inclinado", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca0962161c1413e3627a55.webp" },
      { n: "Press Cerrado", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca96d30cef8b3e4539f312.webp" },
      { n: "Patada de Tríceps", s: 4, r: "15 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca9710dfa727621f5955f8.webp" },
      { n: "Extensión Copa", s: 4, r: "12 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca9781d72f800cf4308fd0.webp" }
    ]},
    mar: { name: "Espalda y Bíceps", exs: [
      { n: "Remo a una mano", s: 4, r: "12 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca98f854146010f74a95d4.webp" },
      { n: "Pájaros (Hombro Post)", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69ca9ace48ebffb7709a4d19.png" },
      { n: "Pullover con mancuerna", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab098ca19f825f8a54e40.png" },
      { n: "Curl Bíceps", s: 4, r: "12 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab291ca19f81a43a5766d.webp" },
      { n: "Curl Martillo", s: 4, r: "12 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab356feee3d49dfaff407.png" },
      { n: "Curl Concentrado", s: 4, r: "10 cada brazo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab49705c1881c111f38f3.png" }
    ]},
    mie: { name: "Piernas Completo", exs: [
      { n: "Sentadilla", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab5465052c37dd700a617.png" },
      { n: "Zancadas Estáticas", s: 4, r: "12 cada pierna", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab5a573e982852c347129.png" },
      { n: "Puente de Glúteo", s: 4, r: "20", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab662ca19f82fe0a5e16b.png" },
      { n: "Hip Thrust", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab764ca19f802efa66017.png" },
      { n: "Elevación Talones", s: 4, r: "25", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cab80d73e98229e9357506.webp" },
      { n: "Patadas de Glúteo (Donkey Kicks)", s: 4, r: "15 cada pierna", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cabbf226e60c5fa33b9a4f.gif" }
    ]},
    jue: { name: "Hombros y Core", exs: [
      { n: "Press Militar", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cac3cd1054262278648a54.png" },
      { n: "Elevaciones Laterales", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cac46c0c5c89ac54bbc902.png" },
      { n: "Elevaciones Frontales", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cac57273e982bad33742fb.png" },
      { n: "Abdominales cortos", s: 4, r: "40s", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cac9721ef83f26784e09e4.png" },
      { n: "Sentadillas combinados con abdominales parados", s: 4, r: "45s", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cace876e78446f9222804e.png" },
      { n: "Windmill con mancuernas", s: 4, r: "15 cada lado", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cad2cf0c5c890593bce85b.jpg" }
    ]},
    vie: { name: "Full Body Mix", exs: [
      { n: "Sentadilla frontal con mancuernas", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cad8c6a853026cb843d2e8.mp4" },
      { n: "Sentadillas", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae01979f48a6502c18080.gif" },
      { n: "Sentadilla sumo", s: 4, r: "12", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae191ca19f85a38aac074.png" },
      { n: "Zancada Lateral", s: 4, r: "10 cada lado", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae240a85302801344855c.png" },
      { n: "Curl + Press", s: 4, r: "10", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae3049e1b294acf27cbc3.png" },
      { n: "Entrenamiento con saco de boxeo", s: 4, r: "Fallo", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae4b3feee3d2f2db5b6af.gif" }
    ]},
    sab: { name: "Glúteos y Cardio", exs: [
      { n: "Hip Thrust", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae50773e982a51139af00.png" },
      { n: "Patada atrás de pie", s: 4, r: "20 por pierna", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae6864a9b24d3cc1e9957.png" },
      { n: "Patada de Glúteo", s: 4, r: "20 p/l", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae6a4453e96bd953de40a.gif" },
      { n: "Patada de glúteo extendida", s: 4, r: "12 p/l", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae842cc64df24d5ceae56.jpg" },
      { n: "Entrenamiento con saco de boxeo", s: 4, r: "20 p/l", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caeb054a9b24caa31f3528.gif" },
      { n: "Sentadilla Sumo", s: 4, r: "15", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69cae191ca19f85a38aac074.png" }
    ]},
    dom: { name: "Día de Reposición", isRest: true, exs: [] }
  }), []);

  // 2. EFECTOS DE AUTENTICACIÓN (CORREGIDO TOKEN MISMATCH)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            console.warn("Custom token falló, usando anónimo:", tokenErr);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error crítico:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 3. PERSISTENCIA EN FIRESTORE
  useEffect(() => {
    if (!user) return;
    try {
      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      const unsubP = onSnapshot(pRef, ds => { 
          if (ds.exists()) setProfile(prev => ({ ...prev, ...ds.data() }));
          else setDoc(pRef, profile);
      });
      const hRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
      const unsubH = onSnapshot(hRef, (snapshot) => {
        setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp));
      });
      return () => { unsubP(); unsubH(); };
    } catch(err) { console.error("Firestore error:", err); }
  }, [user]);

  // 4. CRONÓMETRO DE AYUNO
  useEffect(() => {
    let interval = null;
    if (fastingStart) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, now - fastingStart);
        setElapsedTime({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [fastingStart]);

  // --- FUNCIONES DE ACCIÓN ---
  const startFasting = () => setFastingStart(Date.now());
  const stopFasting = () => setFastingStart(null);
  const addCalories = (val) => setCalories(prev => prev + val);
  
  const toggleSet = (exName, sIdx) => {
    const key = `${activeTab}-${exName}-${sIdx}`;
    setCompletedSets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const finalizeWorkout = async () => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          dayName: String(workout[activeTab].name),
          timestamp: Date.now(),
          dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
        });
        setCompletedSets({});
        setToastMessage("¡Rutina Guardada!");
        setTimeout(() => setToastMessage(null), 3000);
    } catch(e) { console.error("Error guardando:", e); }
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-yellow-400 gap-4">
      <div className="text-4xl font-black italic animate-pulse uppercase">ACERO PRO</div>
      <div className="text-xs uppercase opacity-50 tracking-widest">Cargando perfil seguro...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative selection:bg-yellow-400 selection:text-black">
      
      {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
              <div className="bg-green-500 text-black px-6 py-2 rounded-full font-black uppercase text-[10px] flex items-center gap-2">
                  <CheckCircle2 size={14} /> {toastMessage}
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="p-6 border-b border-white/5 bg-gradient-to-b from-[#111] to-black">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all">
                <Settings size={18} />
            </button>
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">ACERO<span className="text-yellow-400">PRO</span></h1>
                <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold italic">{profile.name}</p>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-blue-500 transition-all">
                <History size={18} />
            </button>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
            {/* CALORIAS */}
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between min-h-[200px]">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Flame size={20} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase text-gray-500">Calorías</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-black italic">{calories}</span>
                        <span className="text-[10px] font-black text-gray-600 mb-1">OBJ: 1500</span>
                    </div>
                    <div className="h-2 w-full bg-black rounded-full mt-3 overflow-hidden border border-white/5">
                        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.min((calories/1500)*100, 100)}%` }}></div>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <input 
                      type="number" 
                      placeholder="+" 
                      value={customCalories} 
                      onChange={e => setCustomCalories(e.target.value)}
                      className="w-20 bg-black/50 border border-white/10 rounded-xl px-3 text-sm font-black outline-none focus:border-yellow-400" 
                    />
                    <button onClick={() => { addCalories(Number(customCalories)); setCustomCalories(""); }} className="flex-1 bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">Sumar</button>
                </div>
            </div>

            {/* AYUNO */}
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <Moon size={20} className={fastingStart ? "text-indigo-400" : "text-gray-600"} />
                        <span className="text-[10px] font-black uppercase text-gray-500">Ayuno</span>
                    </div>
                </div>
                {fastingStart ? (
                    <div className="text-center">
                        <div className="text-4xl font-black italic tabular-nums">
                            {String(elapsedTime.hours).padStart(2, '0')}:{String(elapsedTime.minutes).padStart(2, '0')}:{String(elapsedTime.seconds).padStart(2, '0')}
                        </div>
                        <button onClick={stopFasting} className="mt-4 w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-500/20">Detener</button>
                    </div>
                ) : (
                    <button onClick={() => startFasting()} className="w-full py-5 bg-yellow-400 text-black rounded-2xl font-black uppercase italic text-xs shadow-lg shadow-yellow-400/20">Iniciar Ayuno</button>
                )}
            </div>
        </div>
      </header>

      {/* NAV DIAS */}
      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-y border-white/5 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex gap-2 px-4 justify-start md:justify-center">
          {Object.keys(workout).map(day => (
            <button key={day} onClick={() => setActiveTab(day)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === day ? 'bg-yellow-400 text-black' : 'text-gray-500 hover:text-white'}`}>{day}</button>
          ))}
        </div>
      </nav>

      {/* LISTA EJERCICIOS */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{workout[activeTab].name}</h2>
            <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30">
                <TrendingUp size={14} className="text-purple-400" />
                <span className="text-[10px] font-black uppercase text-purple-400">Nivel {currentMonthLevel}</span>
            </div>
        </div>
        
        {!workout[activeTab].isRest ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                {workout[activeTab].exs.map((ex, i) => {
                    const { s: dynSets, r: dynReps } = getProgressedStats(ex.s, ex.r, currentMonthLevel);
                    return (
                        <div key={i} className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col group hover:border-yellow-400/20 transition-all">
                            <div className="h-28 relative cursor-pointer" onClick={() => setPreviewExercise(ex)}>
                                <img src={ex.img} className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-all" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                                <div className="absolute bottom-3 left-5">
                                    <h4 className="text-xs font-black italic uppercase">{ex.n}</h4>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">{dynReps} Reps • {dynSets} Ser</p>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-4 gap-2">
                                {[...Array(dynSets)].map((_, idx) => {
                                    const isChecked = completedSets[`${activeTab}-${ex.n}-${idx}`];
                                    return (
                                        <button key={idx} onClick={() => toggleSet(ex.n, idx)} className={`h-8 rounded-lg border transition-all flex items-center justify-center font-black text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-gray-700'}`}>
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-white/5">
                <HeartPulse size={40} className="mx-auto mb-4 text-yellow-400 animate-pulse" />
                <p className="text-xs uppercase font-black text-gray-500">Día de recuperación</p>
            </div>
        )}

        <div className="flex justify-center">
             <button onClick={() => finalizeWorkout()} className="w-full max-w-sm bg-yellow-400 text-black py-5 rounded-2xl font-black italic uppercase text-lg shadow-xl shadow-yellow-400/10 active:scale-95 transition-all">Finalizar Rutina</button>
        </div>
      </main>

      {/* MODAL AJUSTES */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
            <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-gray-500"><X size={20}/></button>
                <h2 className="text-xl font-black italic uppercase mb-8 text-white">Ajustes de Perfil</h2>
                <div className="space-y-4">
                    <div className="bg-black/50 p-4 rounded-2xl border border-white/5">
                        <label className="text-[9px] font-black uppercase text-gray-600 block mb-1">Nombre</label>
                        <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-transparent font-black text-white outline-none" />
                    </div>
                    <button onClick={() => { setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'settings', 'profile'), profile); setShowSettings(false); }} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase">Guardar</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {showHistory && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
            <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-8 text-white">
                    <h2 className="text-xl font-black italic uppercase">Historial</h2>
                    <button onClick={() => setShowHistory(false)} className="text-gray-500"><X size={20}/></button>
                </div>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scroll">
                    {history.length > 0 ? history.map(r => (
                        <div key={r.id} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] text-gray-500 uppercase">{String(r.dateString || "")}</p>
                                <h4 className="text-xs font-black italic uppercase text-yellow-400">{String(r.dayName || "Rutina")}</h4>
                            </div>
                            <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                    )) : (
                      <p className="text-center text-gray-600 uppercase font-black text-[10px] py-10">Sin historial aún</p>
                    )}
                </div>
            </div>
          </div>
      )}

      {/* PREVIEW IMAGEN */}
      {previewExercise && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6" onClick={() => setPreviewExercise(null)}>
            <div className="max-w-2xl w-full text-center" onClick={e => e.stopPropagation()}>
                <img src={previewExercise.img} className="w-full rounded-[2.5rem] border border-white/10 shadow-2xl mb-6" />
                <h3 className="text-3xl font-black italic uppercase text-yellow-400">{previewExercise.n}</h3>
                <button onClick={() => setPreviewExercise(null)} className="mt-8 text-[10px] font-black uppercase text-gray-600 border border-white/5 px-6 py-2 rounded-full">Cerrar</button>
            </div>
        </div>
      )}

    </div>
  );
}
