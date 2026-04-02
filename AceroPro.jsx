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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables de entorno seguras
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
  "Si no te desafía, no te cambia. ¡Vamos con todo!",
  "El único mal entrenamiento es el que no sucedió.",
  "Confía en el proceso y los resultados llegarán solos.",
  "Eres más fuerte de lo que crees. ¡Demuéstralo hoy, Graciela!",
  "Un año a partir de ahora, desearás haber empezado hoy. ¡Sigue así!",
  "Transforma esa energía en resultados. ¡Es tu momento!"
];

// Función para calcular la sobrecarga progresiva automática
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
    dailyVideos: {
      lun: "", mar: "", mie: "", jue: "", vie: "", sab: "", dom: ""
    }
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

  // --- LOGICA DE TIEMPOS ---
  useEffect(() => {
    let interval = null;
    if (fastingStart) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = now - fastingStart;
        if (diff < 0) return;
        setElapsedTime({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
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

  // --- INICIO DE FIREBASE SEGURO ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false); // Siempre quitamos el loading, incluso si falla auth
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubP = onSnapshot(pRef, ds => { 
        if (ds.exists()) {
            const data = ds.data();
            if (!data.startDate) {
                data.startDate = Date.now();
                setDoc(pRef, data, { merge: true });
            }
            setProfile(prev => ({ ...prev, ...data }));
        } else {
            setDoc(pRef, profile);
        }
    }, (err) => console.error("Firestore Profile Error:", err));

    const hRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubH = onSnapshot(hRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs.sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => console.error("Firestore History Error:", err));

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

  // --- FUNCIONES ---
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

  const startFasting = (customTime = null) => {
    const startTime = customTime ? new Date(customTime).getTime() : Date.now();
    setFastingStart(startTime);
    saveToLocal(null, null, null, startTime);
  };

  const stopFasting = () => {
    setFastingStart(null);
    saveToLocal(null, null, null, null);
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
        saveToLocal({}, {}, 1, undefined, undefined, undefined, undefined);
        setToastMessage("¡Entrenamiento Registrado!");
        setTimeout(() => setToastMessage(null), 4000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {
        console.error(e);
    }
  };

  const handleEndDayAndFast = async () => {
      if (!user) return;
      if (calories > 0) {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
              dayName: `Cierre de Calorías: ${calories} kcal`,
              dayKey: 'calorias',
              timestamp: Date.now(),
              dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
          });
      }
      const startTime = Date.now();
      const resetHabits = { water: false, creatine: false, protein: false };
      setFastingStart(startTime);
      setCalories(0);
      setHabits(resetHabits);
      saveToLocal(null, null, null, startTime, undefined, 0, resetHabits);
      setToastMessage("¡Día finalizado!");
      setTimeout(() => setToastMessage(null), 3000);
  };

  const saveSettings = async (newProfile) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), newProfile);
    setShowSettings(false);
    setToastMessage("Ajustes guardados");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateWeight = async () => {
      if (!user || !weightInput) return;
      const updatedProfile = { 
          ...profile, 
          currentWeight: Number(weightInput),
          lastWeightUpdate: Date.now() 
      };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), updatedProfile);
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
          dayName: `Registro de Peso: ${weightInput}kg`,
          dayKey: 'peso',
          timestamp: Date.now(),
          dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
      });
      setProfile(updatedProfile);
      setShowWeightModal(false);
      setWeightInput("");
      setToastMessage("¡Peso registrado!");
  };

  const addCalories = (amount) => {
      const newTotal = calories + amount;
      setCalories(newTotal);
      saveToLocal(null, null, null, undefined, undefined, newTotal);
  };

  const toggleHabit = (habitKey) => {
      const newHabits = { ...habits, [habitKey]: !habits[habitKey] };
      setHabits(newHabits);
      saveToLocal(null, null, null, undefined, undefined, undefined, newHabits);
  };

  const weightProgress = useMemo(() => {
    const total = profile.initialWeight - profile.targetWeight;
    const current = profile.initialWeight - profile.currentWeight;
    if (total <= 0) return 0;
    return Math.min(Math.max((current / total) * 100, 0), 100);
  }, [profile]);

  const currentMonthLevel = useMemo(() => {
      if (!profile.startDate) return 1;
      const daysActive = Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24));
      return Math.floor(daysActive / 30) + 1;
  }, [profile.startDate]);

  const groupedHistory = useMemo(() => {
      const groups = {};
      history.forEach(record => {
          const date = new Date(record.timestamp);
          const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
          if (!groups[capitalizedMonth]) groups[capitalizedMonth] = [];
          groups[capitalizedMonth].push(record);
      });
      return groups;
  }, [history]);

  const toggleSet = (exName, sIdx) => {
    const key = `${activeTab}-${exName}-${sIdx}`;
    const newSets = { ...completedSets, [key]: !completedSets[key] };
    setCompletedSets(newSets);
    saveToLocal(newSets);
  };

  const toggleCardio = (cId) => {
    const key = `${activeTab}-r${currentRound}-${cId}`;
    const newCardio = { ...completedCardio, [key]: !completedCardio[key] };
    setCompletedCardio(newCardio);
    saveToLocal(null, newCardio);
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-yellow-400 gap-4">
      <div className="text-4xl font-black italic animate-pulse uppercase">ACERO PRO</div>
      <div className="text-xs font-bold tracking-widest uppercase opacity-50">Cargando perfil...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative overflow-x-hidden">
      
      {/* TOAST */}
      {toastMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
              <div className="bg-green-500 text-black px-6 py-3 rounded-full font-black italic uppercase text-xs flex items-center gap-2 shadow-lg">
                  <CheckCircle2 size={16} /> {toastMessage}
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="p-6 border-b border-white/5 bg-gradient-to-b from-[#111] to-black">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-4">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 text-xs font-black uppercase">
                <Settings size={16} /> <span className="hidden md:inline">Ajustes</span>
            </button>
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">ACERO<span className="text-yellow-400">PRO</span></h1>
                <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold italic">{profile.name}</p>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase">
                 <span className="hidden md:inline">Historial</span> <History size={16} />
            </button>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
            {/* CALORÍAS */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-3xl bg-orange-500/20 text-orange-400">
                            <Flame size={24}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">Consumo Diario</p>
                            <h3 className="text-2xl font-black italic uppercase">Calorías</h3>
                        </div>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-5xl font-black italic tracking-tighter tabular-nums">{calories}</span>
                        <span className="text-sm font-black text-gray-500 uppercase mb-2">/ 1500 kcal</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 mb-6">
                        <div 
                            className={`h-full transition-all duration-1000 ${calories > 1500 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-yellow-400'}`}
                            style={{ width: `${Math.min((calories / 1500) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="Ej: 350"
                            value={customCalories}
                            onChange={(e) => setCustomCalories(e.target.value)}
                            className="flex-1 bg-black/50 text-white text-sm font-black px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-orange-500"
                        />
                        <button 
                            onClick={() => { if(customCalories) { addCalories(Number(customCalories)); setCustomCalories(""); } }} 
                            className="px-6 py-3 bg-white/10 hover:bg-orange-500 text-white hover:text-black rounded-xl text-xs font-black uppercase transition-all"
                        >Sumar</button>
                    </div>
                    <button onClick={handleEndDayAndFast} className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider flex items-center justify-center gap-2">
                        <Moon size={18} /> Finalizar e Iniciar Ayuno
                    </button>
                </div>
            </div>

            {/* AYUNO */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden min-h-[320px]">
                <div className="flex flex-col h-full justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-3xl ${fastingStart ? 'bg-indigo-500/20 text-indigo-400' : 'bg-yellow-400/20 text-yellow-400'}`}>
                                {fastingStart ? <Moon size={24}/> : <Sun size={24}/>}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">
                                    {fastingStart ? 'Ayuno en Proceso' : 'Ayuno Inactivo'}
                                </p>
                                <h3 className="text-2xl font-black italic uppercase">Ayuno</h3>
                            </div>
                        </div>
                    </div>

                    {fastingStart ? (
                        <div className="flex-1 flex flex-col justify-center gap-6">
                            <div className="flex justify-center gap-2 items-baseline">
                                <span className="text-5xl font-black italic tabular-nums">{String(elapsedTime.hours).padStart(2, '0')}</span>
                                <span className="text-gray-600 font-black">:</span>
                                <span className="text-5xl font-black italic tabular-nums">{String(elapsedTime.minutes).padStart(2, '0')}</span>
                                <span className="text-gray-600 font-black">:</span>
                                <span className="text-5xl font-black italic tabular-nums text-indigo-400">{String(elapsedTime.seconds).padStart(2, '0')}</span>
                            </div>
                            <button onClick={stopFasting} className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">
                                Romper Ayuno
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/50 p-4 rounded-2xl border border-white/10">
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Meta</label>
                                    <select value={fastingGoal} onChange={(e) => setFastingGoal(Number(e.target.value))} className="w-full bg-transparent text-sm font-black italic text-yellow-400 outline-none">
                                        {[12, 14, 16, 18, 20, 24].map(h => <option key={h} value={h} className="bg-black">{h} Horas</option>)}
                                    </select>
                                </div>
                                <div className="bg-black/50 p-4 rounded-2xl border border-white/10">
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Inicio Manual</label>
                                    <input type="datetime-local" id="fStart" className="w-full bg-transparent text-[10px] font-black outline-none text-white" />
                                </div>
                            </div>
                            <button onClick={() => { const input = document.getElementById('fStart'); startFasting(input.value || null); }} className="w-full py-5 bg-yellow-400 text-black rounded-3xl text-xs font-black uppercase shadow-xl shadow-yellow-400/20">
                                Iniciar Ayuno
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* HÁBITOS Y PESO */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2"><CheckSquare size={14}/> Hábitos</h3>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => toggleHabit('water')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.water ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black border-white/5 text-gray-500'}`}>
                        <Droplets size={24} /><span className="text-[9px] font-black uppercase">3L Agua</span>
                    </button>
                    <button onClick={() => toggleHabit('creatine')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.creatine ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-black border-white/5 text-gray-500'}`}>
                        <FlaskConical size={24} /><span className="text-[9px] font-black uppercase">Creatina</span>
                    </button>
                    <button onClick={() => toggleHabit('protein')} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.protein ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-black border-white/5 text-gray-500'}`}>
                        <Dumbbell size={24} /><span className="text-[9px] font-black uppercase">Proteína</span>
                    </button>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-3 px-2">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-gray-500">Actual</span>
                        <span className="text-2xl font-black italic text-yellow-400">{profile.currentWeight}kg</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-gray-500">Meta</span>
                        <span className="text-xl font-black italic text-green-500">{profile.targetWeight}kg</span>
                    </div>
                </div>
                <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/10 mb-4">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-green-400" style={{ width: `${weightProgress}%` }}></div>
                </div>
                <button onClick={() => { setWeightInput(profile.currentWeight); setShowWeightModal(true); }} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 border border-white/5 transition-all">
                    <Scale size={16} /> Registrar Peso
                </button>
            </div>
        </div>
      </header>

      {/* NAVEGACIÓN DÍAS */}
      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-y border-white/5 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex gap-2 px-4 justify-start md:justify-center">
          {Object.keys(workout).map(day => (
            <button key={day} onClick={() => setActiveTab(day)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex-shrink-0 ${activeTab === day ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-500'}`}>{day}</button>
          ))}
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-8">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">{workout[activeTab].name}</h2>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30">
                    <TrendingUp size={14} className="text-purple-400" />
                    <span className="text-[10px] font-black uppercase text-purple-400">Nivel {currentMonthLevel}</span>
                </div>
            </div>
        </div>

        {/* EJERCICIOS */}
        {!workout[activeTab].isRest ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {workout[activeTab].exs.map((ex, i) => {
                    const { s: dynSets, r: dynReps } = getProgressedStats(ex.s, ex.r, currentMonthLevel);
                    return (
                        <div key={i} className="bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group hover:border-yellow-400/20 transition-all shadow-xl">
                            <div className="h-28 relative cursor-pointer" onClick={() => setPreviewExercise(ex)}>
                                <img src={ex.img} className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                                <div className="absolute bottom-3 left-5">
                                    <h4 className="text-sm font-black italic uppercase leading-tight">{ex.n}</h4>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">{dynReps} Reps • {dynSets} Ser</p>
                                </div>
                            </div>
                            <div className="p-4 bg-black/20">
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(dynSets)].map((_, idx) => {
                                        const isChecked = completedSets[`${activeTab}-${ex.n}-${idx}`];
                                        return (
                                            <button key={idx} onClick={() => toggleSet(ex.n, idx)} className={`h-10 rounded-xl border transition-all flex items-center justify-center font-black italic text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg' : 'bg-white/5 border-white/10 text-gray-600'}`}>
                                                {isChecked ? <CheckCircle2 size={12}/> : idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        ) : (
            <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5 mb-10">
                <HeartPulse size={48} className="mx-auto mb-6 text-yellow-400 animate-pulse" />
                <h3 className="text-2xl font-black italic uppercase">Día de Reposición</h3>
                <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Aprovecha para descansar o reponer un día perdido.</p>
            </div>
        )}

        {/* BOTÓN FINALIZAR */}
        <div className="flex flex-col items-center">
             <button onClick={() => finalizeWorkout()} className="w-full max-w-sm bg-yellow-400 text-black py-6 rounded-3xl font-black italic uppercase text-xl shadow-2xl hover:scale-105 transition-all">
                {workout[activeTab].isRest ? 'Marcar Reposición' : 'Finalizar Rutina'}
            </button>
        </div>
      </main>

      {/* MODALES SIMPLIFICADOS */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-xl rounded-[2rem] overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase">Ajustes</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 text-gray-500"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black p-4 rounded-xl border border-white/5">
                            <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Inicial</label>
                            <input type="number" value={profile.initialWeight} onChange={e => setProfile({...profile, initialWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-white outline-none" />
                        </div>
                        <div className="bg-black p-4 rounded-xl border border-white/5">
                            <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Meta</label>
                            <input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-green-500 outline-none" />
                        </div>
                    </div>
                    <button onClick={() => saveSettings(profile)} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase italic">Guardar Cambios</button>
                </div>
            </div>
        </div>
      )}

      {showHistory && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-black italic uppercase">Historial</h2>
                    <button onClick={() => setShowHistory(false)} className="p-2 text-gray-500"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {Object.entries(groupedHistory).map(([month, records]) => (
                        <div key={month}>
                            <h3 className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-3">{month}</h3>
                            <div className="space-y-2">
                                {records.map(r => (
                                    <div key={r.id} className="bg-black/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase">{r.dateString}</p>
                                            <h4 className="text-sm font-black italic uppercase">{r.dayName}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {showWeightModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] p-8 text-center">
                <h2 className="text-xl font-black italic uppercase mb-6 text-yellow-400">Peso de Hoy</h2>
                <input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} className="w-full text-center bg-transparent text-6xl font-black italic outline-none text-white border-b border-white/10 mb-8 pb-4" autoFocus />
                <button onClick={handleUpdateWeight} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black uppercase italic">Registrar Peso</button>
                <button onClick={() => setShowWeightModal(false)} className="mt-4 text-[10px] font-black uppercase text-gray-500">Cancelar</button>
            </div>
        </div>
      )}

      {previewExercise && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6" onClick={() => setPreviewExercise(null)}>
            <div className="relative w-full max-w-2xl text-center" onClick={e => e.stopPropagation()}>
                <img src={previewExercise.img} className="w-full rounded-[2rem] border border-white/10 shadow-2xl mb-6" />
                <h3 className="text-3xl font-black italic uppercase text-yellow-400">{previewExercise.n}</h3>
            </div>
        </div>
      )}

    </div>
  );
}
