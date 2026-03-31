import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Scale, Flame, Activity, Target, Trash2, CheckCircle2, Clock, Settings, Zap, RotateCcw, PlayCircle, Trophy, Calendar, CheckSquare, Timer, RefreshCw, Info, History, User, Youtube, Play, AlertCircle, Moon, Sun, ChevronRight, X, Dumbbell, HeartPulse, Medal, Droplets, FlaskConical, TrendingUp, Mail, Lock, LogOut } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Tus llaves reales de AceroPro) ---
const firebaseConfig = {
    apiKey: "AIzaSyDm_vl1HWR9Fu6fZQZZK_Wvap28HAkePfI",
    authDomain: "aceropro-b6832.firebaseapp.com",
    projectId: "aceropro-b6832",
    storageBucket: "aceropro-b6832.firebasestorage.app",
    messagingSenderId: "1024479446926",
    appId: "1:1024479446926:web:b934d19648ec268b2706df",
    measurementId: "G-4PQY15BY05"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'rutina-acero-v8-graciela'; // ID para las rutas de Firestore

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
  "Si no te desafía, no te cambia. ¡Vamos con todo!",
  "El único mal entrenamiento es el que no sucedió.",
  "Confía en el proceso y los resultados llegarán solos.",
  "Eres más fuerte de lo que crees. ¡Demuéstralo hoy, Graciela!",
  "Un año a partir de ahora, desearás haber empezado hoy. ¡Sigue así!",
  "Transforma esa energía en resultados. ¡Es tu momento!"
];

const getProgressedStats = (baseS, baseR, level) => {
    const extraSets = Math.floor((level - 1) / 3);
    const extraReps = ((level - 1) % 3) * 2;
    const finalSets = baseS + extraSets;
    let finalReps = baseR;
    if (typeof baseR === 'string') {
        if (baseR.toLowerCase() === "fallo") {
            finalReps = "Fallo";
        } else if (baseR.includes("s")) {
            finalReps = (parseInt(baseR) + extraReps * 5) + "s";
        } else if (baseR.includes("p/l")) {
            finalReps = (parseInt(baseR) + extraReps) + " p/l";
        } else {
            finalReps = (parseInt(baseR) + extraReps).toString();
        }
    }
    return { s: finalSets, r: finalReps };
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('lun');
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");
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

  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [profile, setProfile] = useState({
    name: "Graciela Arredondo",
    initialWeight: 85,
    currentWeight: 85,
    targetWeight: 60,
    lastWeightUpdate: null,
    startDate: Date.now(),
    dailyVideos: { lun: "", mar: "", mie: "", jue: "", vie: "", sab: "", dom: "" }
  });

  const workout = {
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
  };

  const impactFreeCardio = [
    { id: 'c1', n: "Marcha Alta (Rodillas arriba)", goal: "45 seg", type: "time", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caec141b605d4b902a0c08.gif" },
    { id: 'c2', n: "Paso Lateral (Boxeo)", goal: "45 seg", type: "time", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caecfd1b605d21a12a20cd.png" },
    { id: 'c3', n: "Escalador de Pie (Jumping Jack bajo)", goal: "45 seg", type: "time", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caedb40c5c89cbeebf7b58.png" },
    { id: 'c4', n: "Sentadillas tocando el pie", goal: "20 totales cada pie", type: "reps", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caee08feee3d6ae3b6df0c.png" },
    { id: 'c5', n: "Abdominales de Pie", goal: "20 cada pierna", type: "reps", img: "https://assets.cdn.filesafe.space/CvWCGrWG4kiyHjWFLKST/media/69caeee073e982af663ae7c1.png" }
  ];

  const showAlert = (message, isError = false) => {
    setToastMessage(message);
    setToastType(isError ? "error" : "success");
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
        showAlert("Por favor, llena todos los campos.", true);
        return;
    }
    setAuthLoading(true);
    try {
        if (isRegistering) {
            await createUserWithEmailAndPassword(auth, email, password);
            showAlert("¡Cuenta creada con éxito!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert("¡Bienvenida de nuevo!");
        }
    } catch (error) {
        console.error("Auth Error:", error);
        // MENSAJES DETALLADOS PARA SABER QUÉ PASA EXACTAMENTE
        if (error.code === 'auth/email-already-in-use') showAlert("Ese correo ya está registrado. Dale a 'INICIA SESIÓN' abajo.", true);
        else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') showAlert("Contraseña incorrecta.", true);
        else if (error.code === 'auth/operation-not-allowed') showAlert("Firebase: Habilita Correo/Contraseña en la consola.", true);
        else if (error.code === 'auth/weak-password') showAlert("La contraseña debe tener al menos 6 caracteres.", true);
        else showAlert(`Error (${error.code}): ${error.message}`, true);
    } finally {
        setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
          setUser(null);
          setShowSettings(false);
          showAlert("Sesión cerrada correctamente.");
      } catch (error) {
          showAlert("Error al cerrar sesión.", true);
      }
  };

  useEffect(() => {
    let interval = null;
    if (fastingStart) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = now - fastingStart;
        if (diff < 0) return;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime({ hours, minutes, seconds });
      }, 1000);
    } else {
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    }
    return () => clearInterval(interval);
  }, [fastingStart]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && cardioTimer > 0) {
      interval = setInterval(() => setCardioTimer((prev) => prev - 1), 1000);
    } else if (cardioTimer === 0) {
      if (timerMode === 'work') {
        setTimerMode('rest');
        setCardioTimer(30); 
      } else {
        setTimerMode('work');
        setCardioTimer(45);
        setIsTimerRunning(false);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, cardioTimer, timerMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubP = onSnapshot(pRef, (ds) => { 
        if (ds.exists()) {
            setProfile(prev => ({ ...prev, ...ds.data() }));
        } else {
            setDoc(pRef, profile).catch(err => console.error(err));
        }
    });

    const hRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubH = onSnapshot(hRef, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(docs.sort((a, b) => b.timestamp - a.timestamp));
    });

    const saved = localStorage.getItem(`acero_v8_data_${user.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCompletedSets(parsed.sets || {});
      setCompletedCardio(parsed.cardio || {});
      setCurrentRound(parsed.round || 1);
      if (parsed.fastingStart) setFastingStart(parsed.fastingStart);
      if (parsed.fastingGoal) setFastingGoal(parsed.fastingGoal);
      if (parsed.calories) setCalories(parsed.calories);
      if (parsed.habits) setHabits(parsed.habits);
    }
    return () => { unsubP(); unsubH(); };
  }, [user]);

  const saveToLocal = (sets, cardio, round, fStart, fGoal, cals, habs) => {
    if (!user) return;
    localStorage.setItem(`acero_v8_data_${user.uid}`, JSON.stringify({ 
        sets: sets || completedSets, 
        cardio: cardio || completedCardio, 
        round: round || currentRound, 
        fastingStart: fStart !== undefined ? fStart : fastingStart,
        fastingGoal: fGoal || fastingGoal,
        calories: cals !== undefined ? cals : calories,
        habits: habs || habits
    }));
  };

  const finalizeWorkout = async (customDayName = null) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          dayName: customDayName || workout[activeTab].name,
          dayKey: activeTab,
          timestamp: Date.now(),
          dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
        });
        setCompletedSets({});
        setCompletedCardio({});
        setCurrentRound(1);
        saveToLocal({}, {}, 1);
        showAlert("¡Entrenamiento Registrado!");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        showAlert("Error al guardar en Firebase.", true);
    }
  };

  const handleEndDayAndFast = async () => {
      if (!user) return;
      try {
          if (calories > 0) {
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
                  dayName: `Consumo: ${calories} kcal`,
                  dayKey: 'calorias',
                  timestamp: Date.now(),
                  dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
              });
          }
          const startTime = Date.now();
          setFastingStart(startTime);
          setCalories(0);
          setHabits({ water: false, creatine: false, protein: false });
          saveToLocal(null, null, null, startTime, undefined, 0, { water: false, creatine: false, protein: false });
          showAlert("¡Día cerrado y ayuno iniciado!");
      } catch (error) {
          showAlert("Fallo al finalizar el día.", true);
      }
  };

  const daysSinceLastWeight = useMemo(() => {
      if (!profile.lastWeightUpdate) return 7; 
      return Math.floor((Date.now() - profile.lastWeightUpdate) / (1000 * 60 * 60 * 24));
  }, [profile.lastWeightUpdate]);

  const currentMonthLevel = useMemo(() => {
      const daysActive = Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24));
      return Math.floor(daysActive / 30) + 1;
  }, [profile.startDate]);

  const groupedHistory = useMemo(() => {
      const groups = {};
      history.forEach(record => {
          const date = new Date(record.timestamp);
          const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
          if (!groups[capitalized]) groups[capitalized] = [];
          groups[capitalized].push(record);
      });
      return groups;
  }, [history]);

  const weightProgress = useMemo(() => {
    const total = profile.initialWeight - profile.targetWeight;
    const current = profile.initialWeight - profile.currentWeight;
    if (total <= 0) return 0;
    return Math.min(Math.max((current / total) * 100, 0), 100);
  }, [profile]);

  if (loading) return <div className="h-screen bg-[#050505] flex flex-col items-center justify-center"><Dumbbell className="text-yellow-400 animate-bounce mb-4" size={48}/><span className="text-yellow-400 font-black italic tracking-widest uppercase animate-pulse">Cargando Acero Pro...</span></div>;

  if (!user) {
      return (
          <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6 relative">
              {toastMessage && (
                  <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
                      <div className={`px-6 py-3 rounded-full font-black italic uppercase text-xs flex items-center gap-2 shadow-2xl ${toastType === "error" ? 'bg-red-500 text-white border border-red-400' : 'bg-green-500 text-black'}`}>
                          {toastType === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                          {toastMessage}
                      </div>
                  </div>
              )}
              <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 blur-[80px] -mr-20 -mt-20 bg-yellow-500/20"></div>
                  <div className="text-center mb-10 relative z-10">
                      <div className="w-20 h-20 bg-black border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><Trophy className="text-yellow-400" size={36} /></div>
                      <h1 className="text-5xl font-black italic tracking-tighter">ACERO<span className="text-yellow-400">PRO</span></h1>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em] mt-2">{isRegistering ? 'Crea tu cuenta' : 'Inicia Sesión'}</p>
                  </div>
                  <form onSubmit={handleAuth} className="space-y-4 relative z-10">
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-yellow-400 transition-colors" required />
                      </div>
                      <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-yellow-400 transition-colors" required />
                      </div>
                      <button type="submit" disabled={authLoading} className="w-full bg-yellow-400 text-black font-black italic uppercase rounded-2xl py-4 mt-6 hover:bg-yellow-300 hover:scale-[1.02] transition-all shadow-xl shadow-yellow-400/20">
                          {authLoading ? 'Cargando...' : (isRegistering ? 'Registrarme' : 'Entrar')}
                      </button>
                  </form>
                  <div className="mt-8 text-center relative z-10 border-t border-white/10 pt-6">
                      <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-gray-400 font-bold hover:text-white transition-colors uppercase tracking-widest">
                          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      {toastMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
              <div className={`px-6 py-3 rounded-full font-black italic uppercase text-xs flex items-center gap-2 shadow-2xl ${toastType === "error" ? 'bg-red-500 text-white border border-red-400' : 'bg-green-500 text-black'}`}>
                  {toastType === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  {toastMessage}
              </div>
          </div>
      )}

      <header className="p-6 border-b border-white/5 bg-gradient-to-b from-[#111] to-black relative">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-4">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 text-xs font-black uppercase"><Settings size={16} /> <span className="hidden md:inline">Ajustes</span></button>
            <div className="text-center">
                <h1 className="text-4xl font-black italic tracking-tighter">ACERO<span className="text-yellow-400">PRO</span></h1>
                <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold italic">{profile.name}</p>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase"><span className="hidden md:inline">Historial</span> <History size={16} /></button>
        </div>
        
        <div className="text-center mb-10 max-w-md mx-auto">
            <p className="text-[11px] font-bold text-yellow-400/80 italic tracking-wider animate-in fade-in duration-1000">"{MOTIVATIONAL_QUOTES[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % MOTIVATIONAL_QUOTES.length]}"</p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 bg-orange-500/10"></div>
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-3xl bg-orange-500/20 text-orange-400 shadow-orange-500/20 shadow-lg"><Flame size={24}/></div>
                        <div><p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Consumo Diario</p><h3 className="text-2xl font-black italic uppercase tracking-tight">Calorías</h3></div>
                    </div>
                    <div className="flex justify-between items-end mb-2"><span className="text-5xl font-black italic tracking-tighter tabular-nums text-white">{calories}</span><span className="text-sm font-black text-gray-500 uppercase mb-2">/ 1500 kcal</span></div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner"><div className={`h-full transition-all duration-1000 ${calories > 1500 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-yellow-400'}`} style={{ width: `${Math.min((calories / 1500) * 100, 100)}%` }}></div></div>
                </div>
                <div className="mt-6 space-y-4">
                    <div className="flex gap-2">
                        <input type="number" placeholder="Suma calorias..." value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} className="flex-1 bg-black/50 text-white text-sm font-black px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-orange-500" />
                        <button onClick={() => { if(customCalories) { setCalories(c => c + Number(customCalories)); setCustomCalories(""); saveToLocal(null,null,null,undefined,undefined,calories + Number(customCalories)); } }} className="px-6 py-3 bg-white/10 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase transition-all">Sumar</button>
                    </div>
                    {!fastingStart && <button onClick={handleEndDayAndFast} className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"><Moon size={18} /> Cerrar Día e Iniciar Ayuno</button>}
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-colors duration-1000 ${fastingStart ? 'bg-indigo-500/20' : 'bg-yellow-500/20'}`}></div>
                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-3xl ${fastingStart ? 'bg-indigo-500/20 text-indigo-400 shadow-indigo-500/20 shadow-lg' : 'bg-yellow-400/20 text-yellow-400'}`}>{fastingStart ? <Moon size={24} className="animate-pulse"/> : <Sun size={24}/>}</div>
                            <div><p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">{fastingStart ? 'Ayuno en Proceso' : 'Estado: Puedes Comer'}</p><h3 className="text-2xl font-black italic uppercase tracking-tight">{fastingStart ? 'Cronómetro' : 'Inicia Ayuno'}</h3></div>
                        </div>
                        {fastingStart && <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-center"><p className="text-[8px] font-black text-gray-500 uppercase">Meta</p><p className="text-xs font-black italic text-yellow-400">{fastingGoal}h</p></div>}
                    </div>
                    {fastingStart ? (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center gap-2 items-baseline">
                                <div><span className="text-5xl font-black italic tracking-tighter tabular-nums">{String(elapsedTime.hours).padStart(2, '0')}</span><p className="text-[8px] font-black uppercase text-gray-600 mt-1">HRS</p></div>
                                <span className="text-4xl font-black text-gray-700 animate-pulse">:</span>
                                <div><span className="text-5xl font-black italic tracking-tighter tabular-nums">{String(elapsedTime.minutes).padStart(2, '0')}</span><p className="text-[8px] font-black uppercase text-gray-600 mt-1">MIN</p></div>
                                <span className="text-4xl font-black text-gray-700 animate-pulse">:</span>
                                <div><span className="text-5xl font-black italic tracking-tighter tabular-nums text-indigo-400">{String(elapsedTime.seconds).padStart(2, '0')}</span><p className="text-[8px] font-black uppercase text-gray-600 mt-1">SEG</p></div>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-600 to-blue-400 transition-all duration-1000 shadow-lg shadow-indigo-500/50" style={{ width: `${Math.min((elapsedTime.hours / fastingGoal) * 100, 100)}%` }}></div></div>
                            <button onClick={() => { setFastingStart(null); saveToLocal(null,null,null,null); }} className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Romper Ayuno</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><label className="text-[8px] font-black text-gray-500 uppercase block mb-2">Meta</label><select value={fastingGoal} onChange={(e) => setFastingGoal(Number(e.target.value))} className="w-full bg-transparent text-sm font-black italic outline-none text-yellow-400">{[12, 14, 16, 18, 20, 24].map(h => <option key={h} value={h} className="bg-black">{h} Horas</option>)}</select></div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><label className="text-[8px] font-black text-gray-500 uppercase block mb-2">Inicio (Opcional)</label><input type="datetime-local" id="fastStartInput" className="w-full bg-transparent text-[10px] font-black outline-none text-white appearance-none" /></div>
                            </div>
                            <button onClick={() => { const inp = document.getElementById('fastStartInput'); const time = inp.value ? new Date(inp.value).getTime() : Date.now(); setFastingStart(time); saveToLocal(null,null,null,time); }} className="w-full py-5 bg-yellow-400 text-black rounded-3xl text-xs font-black uppercase shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-2"><Zap size={16} fill="black" /> Iniciar Ayuno Ahora</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto mb-4 grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-lg flex flex-col justify-center">
                <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2"><CheckSquare size={14}/> Hábitos Diarios</h3>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => { const h = {...habits, water: !habits.water}; setHabits(h); saveToLocal(null,null,null,undefined,undefined,undefined,h); }} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.water ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/50 border-white/5 text-gray-500'}`}><Droplets size={24} /><span className="text-[9px] font-black uppercase text-center">3L Agua</span></button>
                    <button onClick={() => { const h = {...habits, creatine: !habits.creatine}; setHabits(h); saveToLocal(null,null,null,undefined,undefined,undefined,h); }} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.creatine ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black/50 border-white/5 text-gray-500'}`}><FlaskConical size={24} /><span className="text-[9px] font-black uppercase text-center">Creatina</span></button>
                    <button onClick={() => { const h = {...habits, protein: !habits.protein}; setHabits(h); saveToLocal(null,null,null,undefined,undefined,undefined,h); }} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.protein ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black/50 border-white/5 text-gray-500'}`}><Dumbbell size={24} /><span className="text-[9px] font-black uppercase text-center">Proteína</span></button>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-lg relative overflow-hidden flex flex-col justify-center">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 text-center md:text-left">
                    <div className="flex-1 w-full">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-3 px-2"><span className="text-gray-500">Inicio: {profile.initialWeight}kg</span><span className="text-yellow-400 text-lg italic tracking-tighter">Actual: {profile.currentWeight}kg</span><span className="text-green-500">Meta: {profile.targetWeight}kg</span></div>
                        <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/10 shadow-inner"><div className="h-full bg-gradient-to-r from-yellow-500 to-green-400 transition-all duration-1000 relative" style={{ width: `${weightProgress}%` }}><div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div></div></div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-3 italic">Faltan {Math.max(profile.currentWeight - profile.targetWeight, 0).toFixed(1)}kg</p>
                    </div>
                    <button onClick={() => { setWeightInput(profile.currentWeight); setShowWeightModal(true); }} className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-xl flex items-center gap-2 ${needsWeightUpdate ? 'bg-yellow-400 text-black animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}><Scale size={16} /> Pesarme</button>
                </div>
            </div>
        </div>
      </header>

      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-y border-white/5 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex gap-2 px-4 justify-start md:justify-center">
          {Object.keys(workout).map(day => (
            <button key={day} onClick={() => setActiveTab(day)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex-shrink-0 ${activeTab === day ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-gray-500 hover:text-white'}`}>{day}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-8">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">{workout[activeTab].name}</h2>
            <div className="flex items-center gap-3">
                {!workout[activeTab].isRest && <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30 text-purple-400"><TrendingUp size={14} /><span className="text-[10px] font-black uppercase tracking-wider">Nivel {currentMonthLevel}</span></div>}
                <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/20 text-yellow-400"><Dumbbell size={14} /><span className="text-[10px] font-black uppercase tracking-wider">{workout[activeTab].isRest ? 'Recuperación' : 'Plan Acero'}</span></div>
            </div>
        </div>

        {workout[activeTab].isRest ? (
            <section className="bg-yellow-400/5 border border-yellow-400/20 rounded-[3rem] p-12 text-center">
                <AlertCircle className="text-yellow-400 mx-auto mb-6" size={48} />
                <h3 className="text-3xl font-black italic uppercase text-white mb-4">¿Te faltó algún día esta semana?</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mt-10">{['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(day => (<button key={day} onClick={() => setActiveTab(day)} className="group bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-yellow-400 hover:border-yellow-400 transition-all flex flex-col items-center"><span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-black/50 mb-1">{day}</span><span className="text-sm font-black italic uppercase text-white group-hover:text-black">{workout[day].name}</span></button>))}</div>
            </section>
        ) : (
            <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {workout[activeTab].exs.map((ex, i) => {
                        const { s: dynSets, r: dynReps } = getProgressedStats(ex.s, ex.r, currentMonthLevel);
                        return (
                            <div key={i} className="bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group hover:border-yellow-400/20 transition-all">
                                <div className="h-28 relative cursor-pointer" onClick={() => setPreviewExercise(ex)}>
                                    <img src={ex.img} className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                                    <div className="absolute bottom-3 left-5"><h4 className="text-sm font-black italic uppercase text-white leading-tight">{ex.n}</h4><p className="text-[9px] font-bold text-gray-500 uppercase">{dynReps} Reps • {dynSets} Series</p></div>
                                </div>
                                <div className="p-4 bg-black/20"><div className="grid grid-cols-4 gap-2">{[...Array(dynSets)].map((_, idx) => {
                                    const key = `${activeTab}-${ex.n}-${idx}`;
                                    const isChecked = completedSets[key];
                                    return (<button key={idx} onClick={() => { const n = {...completedSets, [key]: !isChecked}; setCompletedSets(n); saveToLocal(n); }} className={`h-10 rounded-xl border transition-all flex items-center justify-center font-black italic text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-105' : 'bg-white/5 border-white/10 text-gray-600 hover:border-white/20'}`}>{isChecked ? <CheckCircle2 size={12}/> : idx + 1}</button>);
                                })}</div></div>
                            </div>
                        )
                    })}
                </div>

                <section className="bg-[#0a0a0a] rounded-[3rem] border border-white/5 p-6 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                        <div><h3 className="text-3xl font-black italic uppercase tracking-tight text-blue-500 mb-2">Cardio sin Impacto</h3><p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">3 Vueltas • Sigue el video y la tabla</p></div>
                        <div className="flex gap-2 bg-white/5 p-2 rounded-3xl">{[1, 2, 3].map(v => (<button key={v} onClick={() => { setCurrentRound(v); saveToLocal(null,null,v); }} className={`px-4 py-2 rounded-2xl font-black italic text-[10px] transition-all ${currentRound === v ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>VUELTA {v}</button>))}</div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                        <div className="space-y-6">
                            <div className="bg-black rounded-[2rem] overflow-hidden border border-white/5 aspect-video w-full flex items-center justify-center relative shadow-inner">
                                {profile.dailyVideos?.[activeTab] ? (
                                    <iframe className="w-full h-full absolute inset-0" src={profile.dailyVideos[activeTab].replace("watch?v=", "embed/")} title="Cardio" frameBorder="0" allowFullScreen></iframe>
                                ) : (
                                    <div className="text-center p-8"><Youtube className="text-gray-700 mx-auto mb-4" size={40} /><p className="text-[10px] font-black uppercase text-gray-600 mb-2">Añade el link en Ajustes</p></div>
                                )}
                            </div>
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Timer</h4>
                                <div className="text-6xl font-black italic tracking-tighter mb-4 text-blue-400">00:{String(cardioTimer).padStart(2, '0')}</div>
                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all ${isTimerRunning ? 'bg-red-500/20 text-red-500' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}>{isTimerRunning ? 'Pausar' : 'Iniciar'} <Play size={14} /></button>
                                    <button onClick={() => { setCardioTimer(45); setTimerMode('work'); setIsTimerRunning(false); }} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 text-gray-400"><RotateCcw size={16} /></button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {impactFreeCardio.map(c => {
                                const key = `${activeTab}-r${currentRound}-${c.id}`;
                                const isDone = completedCardio[key];
                                return (
                                    <div key={c.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isDone ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPreviewExercise({ n: c.n, img: c.img })}><img src={c.img} className="w-12 h-12 rounded-xl object-cover opacity-50grayscale group-hover:opacity-100 transition-all" /><div><h5 className="text-sm font-black italic text-white uppercase">{c.n}</h5><p className="text-[10px] text-gray-400 font-bold uppercase">{c.goal}</p></div></div>
                                        <button onClick={() => { const n = {...completedCardio, [key]: !isDone}; setCompletedCardio(n); saveToLocal(null, n); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-gray-500 hover:bg-white/20'}`}><CheckCircle2 size={18} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
                <div className="mt-8 border-t border-white/10 pt-12 flex flex-col items-center">
                    <button onClick={() => finalizeWorkout()} className="group relative w-full max-w-sm overflow-hidden rounded-[2rem] p-1 transition-all hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-green-500 to-yellow-400 animate-pulse"></div>
                        <div className="relative bg-black px-8 py-6 rounded-[1.8rem] flex items-center justify-center gap-3"><Trophy className="text-yellow-400" size={24} /><span className="text-xl font-black italic uppercase text-white tracking-tighter">Finalizar Entrenamiento</span></div>
                    </button>
                </div>
            </>
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50"><h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2"><Settings className="text-yellow-400" /> Ajustes</h2><button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-xl"><X size={20}/></button></div>
                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    <section><h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Metas</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Inicial</label><input type="number" value={profile.initialWeight} onChange={e => setProfile({...profile, initialWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-white outline-none" /></div>
                            <div className="bg-black p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Actual</label><input type="number" value={profile.currentWeight} onChange={e => setProfile({...profile, currentWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-yellow-400 outline-none" /></div>
                            <div className="bg-black p-4 rounded-2xl border border-white/5"><label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Meta</label><input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-green-500 outline-none" /></div>
                        </div>
                    </section>
                    <section><h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4"><Youtube size={14}/> Links de Video</h3>
                        <div className="space-y-3">{['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(day => (
                            <div key={day} className="flex items-center gap-3 bg-black p-2 rounded-xl border border-white/5"><span className="w-12 text-[9px] font-black uppercase text-center text-gray-500 bg-white/5 py-2 rounded-lg">{day}</span><input type="text" placeholder="URL de Youtube..." value={profile.dailyVideos?.[day] || ''} onChange={e => setProfile({...profile, dailyVideos: {...profile.dailyVideos, [day]: e.target.value}})} className="flex-1 bg-transparent text-xs font-medium text-white outline-none" /></div>
                        ))}</div>
                    </section>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/50 space-y-4"><button onClick={() => { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), profile); setShowSettings(false); showAlert("Cambios guardados"); }} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider hover:bg-yellow-300 transition-all">Guardar Cambios</button><button onClick={handleLogout} className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black italic uppercase flex items-center justify-center gap-2"><LogOut size={16} /> Cerrar Sesión</button></div>
            </div>
        </div>
      )}

      {showHistory && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50"><h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white"><History className="text-blue-500" /> Historial</h2><button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"><X size={20}/></button></div>
                <div className="p-6 overflow-y-auto flex-1 bg-[#0a0a0a]">
                    {Object.entries(groupedHistory).map(([m, rs]) => (
                        <div key={m} className="mb-8 relative"><div className="sticky top-[-24px] z-10 bg-[#0a0a0a]/90 backdrop-blur-md py-3 mb-4 border-b border-white/10"><h3 className="text-sm font-black text-yellow-400 uppercase tracking-[0.2em]">{m}</h3></div><div className="space-y-3">{rs.map((r) => (<div key={r.id} className="bg-[#111] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all"><div><p className="text-[10px] font-black uppercase text-gray-500 mb-1">{r.dateString}</p><h4 className="text-sm md:text-lg font-black italic text-white leading-tight">{r.dayName}</h4></div><div className="flex items-center gap-4"><span className="bg-green-500/10 text-green-500 px-3 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12}/> OK</span><button onClick={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', r.id)); showAlert("Eliminado"); }} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={16} /></button></div></div>))}</div></div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {showWeightModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50"><h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Tu Peso</h2><button onClick={() => setShowWeightModal(false)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"><X size={20}/></button></div>
                <div className="p-8 flex flex-col items-center bg-[#0a0a0a]"><div className="relative mb-8 text-center"><input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="w-40 text-center bg-transparent text-6xl font-black italic outline-none text-yellow-400 border-b-2 border-yellow-400/30 pb-2 focus:border-yellow-400" autoFocus /><span className="text-xl font-black text-gray-600 uppercase italic">kg</span></div><button onClick={() => { handleUpdateWeight(); }} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider hover:bg-yellow-300 transition-all shadow-xl shadow-yellow-400/20">Guardar Registro</button></div>
            </div>
        </div>
      )}

      {previewExercise && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95" onClick={() => setPreviewExercise(null)}>
            <div className="relative w-full max-w-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}><button onClick={() => setPreviewExercise(null)} className="absolute -top-12 right-0 md:-right-12 p-2 text-gray-400 hover:text-white transition-colors bg-black/50 rounded-full"><X size={24} /></button><img src={previewExercise.img} alt={previewExercise.n} className="w-full max-h-[60vh] object-cover rounded-[2rem] shadow-2xl border border-white/10" /><div className="mt-6 text-center"><h3 className="text-3xl font-black italic uppercase text-yellow-400 tracking-tighter">{previewExercise.n}</h3><p className="text-xs font-bold text-gray-500 uppercase mt-2 tracking-widest">Toca afuera para cerrar</p></div></div>
        </div>
      )}

    </div>
  );
}
}
