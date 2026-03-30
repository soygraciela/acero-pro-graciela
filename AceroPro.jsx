import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, addDoc, deleteDoc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Scale, Flame, Activity, Target, Trash2, CheckCircle2, Clock, Settings, Zap, RotateCcw, PlayCircle, Trophy, Calendar, CheckSquare, Timer, RefreshCw, Info, History, User, Youtube, Play, AlertCircle, Moon, Sun, ChevronRight, X, Dumbbell, HeartPulse, Medal, Droplets, FlaskConical, TrendingUp } from 'lucide-react';

// --- FIREBASE SETUP ---
const firebaseConfig = JSON.parse(__firebase_config);
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
  "Si no te desafía, no te cambia. ¡Vamos con todo!",
  "El único mal entrenamiento es el que no sucedió.",
  "Confía en el proceso y los resultados llegarán solos.",
  "Eres más fuerte de lo que crees. ¡Demuéstralo hoy, Graciela!",
  "Un año a partir de ahora, desearás haber empezado hoy. ¡Sigue así!",
  "Transforma esa energía en resultados. ¡Es tu momento!"
];

// Función para calcular la sobrecarga progresiva automática
const getProgressedStats = (baseS, baseR, level) => {
    const extraSets = Math.floor((level - 1) / 3); // +1 serie cada 3 meses
    const extraReps = ((level - 1) % 3) * 2; // +2 reps cada mes (se reinicia al subir serie)

    const finalSets = baseS + extraSets;
    let finalReps = baseR;

    if (typeof baseR === 'string') {
        if (baseR.toLowerCase() === "fallo") {
            finalReps = "Fallo";
        } else if (baseR.includes("s")) {
            finalReps = (parseInt(baseR) + extraReps * 5) + "s"; // Sube 5 segundos por mes
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
  
  // Hábitos Diarios
  const [habits, setHabits] = useState({ water: false, creatine: false, protein: false });
  
  const [completedSets, setCompletedSets] = useState({});
  const [completedCardio, setCompletedCardio] = useState({});
  
  const [currentRound, setCurrentRound] = useState(1);
  const [cardioTimer, setCardioTimer] = useState(45);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('work'); 

  // --- ESTADO DEL AYUNO ---
  const [fastingStart, setFastingStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [fastingGoal, setFastingGoal] = useState(16);

  // Perfil por defecto (Meta de 60kg)
  const [profile, setProfile] = useState({
    name: "Graciela Arredondo",
    initialWeight: 85,
    currentWeight: 85,
    targetWeight: 60,
    lastWeightUpdate: null,
    startDate: Date.now(), // Para calcular los meses de progreso
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

  // --- CRONÓMETRO DE AYUNO PRECISO ---
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

  // --- TIMER LOGIC (Cardio) ---
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

  // --- FIREBASE & PERSISTENCE ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Perfil
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubP = onSnapshot(pRef, ds => { 
        if (ds.exists()) {
            const data = ds.data();
            // Asegurarnos de que tenga una fecha de inicio para calcular los meses
            if (!data.startDate) {
                data.startDate = Date.now();
                setDoc(pRef, data, { merge: true });
            }
            setProfile(prev => ({ ...prev, ...data }));
        } else {
            setDoc(pRef, profile);
        }
    });

    // Historial
    const hRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubH = onSnapshot(hRef, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs.sort((a, b) => b.timestamp - a.timestamp));
    });

    // Local Storage (Estado temporal del día)
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

  const startFasting = (customTime = null) => {
    const startTime = customTime ? new Date(customTime).getTime() : Date.now();
    setFastingStart(startTime);
    saveToLocal(null, null, null, startTime);
  };

  const stopFasting = () => {
    setFastingStart(null);
    saveToLocal(null, null, null, null);
  };

  // --- FINALIZAR Y REGISTRAR ENTRENAMIENTO ---
  const finalizeWorkout = async (customDayName = null) => {
    if (!user) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'history'), {
      dayName: customDayName || workout[activeTab].name,
      dayKey: activeTab,
      timestamp: Date.now(),
      dateString: new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    });

    // Limpiar estados 
    setCompletedSets({});
    setCompletedCardio({});
    setCurrentRound(1);
    
    // Limpiar local storage de entrenamiento
    saveToLocal({}, {}, 1, undefined, undefined, undefined, undefined);

    setToastMessage("¡Entrenamiento Registrado con Éxito! Casillas reiniciadas.");
    setTimeout(() => setToastMessage(null), 4000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      // Iniciar ayuno y reiniciar hábitos diarios
      const startTime = Date.now();
      const resetHabits = { water: false, creatine: false, protein: false };
      
      setFastingStart(startTime);
      setCalories(0);
      setHabits(resetHabits);
      
      // Guardar todo
      saveToLocal(null, null, null, startTime, undefined, 0, resetHabits);

      setToastMessage("¡Día finalizado! Hábitos reiniciados y Ayuno iniciado.");
      setTimeout(() => setToastMessage(null), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- GUARDAR CONFIGURACIONES ---
  const saveSettings = async (newProfile) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), newProfile);
    setShowSettings(false);
    setToastMessage("Ajustes guardados correctamente");
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
      setToastMessage("¡Peso registrado con éxito!");
      setTimeout(() => setToastMessage(null), 3000);
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

  // Calcular días desde el último registro de peso
  const daysSinceLastWeight = useMemo(() => {
      if (!profile.lastWeightUpdate) return 7; 
      return Math.floor((Date.now() - profile.lastWeightUpdate) / (1000 * 60 * 60 * 24));
  }, [profile.lastWeightUpdate]);

  const needsWeightUpdate = daysSinceLastWeight >= 7;

  // Calcular en qué mes de entrenamiento estamos (para la sobrecarga)
  const currentMonthLevel = useMemo(() => {
      if (!profile.startDate) return 1;
      const daysActive = Math.floor((Date.now() - profile.startDate) / (1000 * 60 * 60 * 24));
      return Math.floor(daysActive / 30) + 1;
  }, [profile.startDate]);

  // Fechas de peso (Último y Próximo)
  const weightDatesInfo = useMemo(() => {
      if (!profile.lastWeightUpdate) return null;
      const lastDate = new Date(profile.lastWeightUpdate);
      const nextDate = new Date(profile.lastWeightUpdate + 7 * 24 * 60 * 60 * 1000); 
      
      const formatOpts = { day: 'numeric', month: 'short' };
      return {
          last: lastDate.toLocaleDateString('es-ES', formatOpts),
          next: nextDate.toLocaleDateString('es-ES', formatOpts),
          daysLeft: Math.max(7 - daysSinceLastWeight, 0)
      };
  }, [profile.lastWeightUpdate, daysSinceLastWeight]);

  // Agrupar historial por Mes y Año
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

  // --- BORRAR HISTORIAL ---
  const deleteHistoryRecord = async (id) => {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', id));
  };

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

  const weightProgress = useMemo(() => {
    const total = profile.initialWeight - profile.targetWeight;
    const current = profile.initialWeight - profile.currentWeight;
    if (total <= 0) return 0;
    return Math.min(Math.max((current / total) * 100, 0), 100);
  }, [profile]);

  const dailyQuote = useMemo(() => {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return MOTIVATIONAL_QUOTES[daysSinceEpoch % MOTIVATIONAL_QUOTES.length];
  }, []);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-yellow-400 font-black italic tracking-widest animate-pulse uppercase">Cargando Acero Pro...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-24 relative">
      
      {/* ALERTA FLOTANTE (TOAST) */}
      {toastMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in">
              <div className="bg-green-500 text-black px-6 py-3 rounded-full font-black italic uppercase text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                  <CheckCircle2 size={16} />
                  {toastMessage}
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="p-6 border-b border-white/5 bg-gradient-to-b from-[#111] to-black relative">
        <div className="max-w-5xl mx-auto flex justify-between items-center mb-4">
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 text-xs font-black uppercase">
                <Settings size={16} /> <span className="hidden md:inline">Ajustes</span>
            </button>
            <div className="text-center">
                <h1 className="text-4xl font-black italic tracking-tighter">ACERO<span className="text-yellow-400">PRO</span></h1>
                <p className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-bold italic">{profile.name}</p>
            </div>
            <button onClick={() => setShowHistory(true)} className="p-3 bg-white/5 rounded-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 text-xs font-black uppercase">
                 <span className="hidden md:inline">Historial</span> <History size={16} />
            </button>
        </div>
        
        {/* FRASE MOTIVACIONAL */}
        <div className="text-center mb-10 max-w-md mx-auto">
            <p className="text-[11px] font-bold text-yellow-400/80 italic tracking-wider animate-in fade-in duration-1000">
                "{dailyQuote}"
            </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
            {/* MÓDULO DE CALORÍAS */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 bg-orange-500/10"></div>
                
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-3xl bg-orange-500/20 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                            <Flame size={24}/>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">
                                Consumo Diario
                            </p>
                            <h3 className="text-2xl font-black italic uppercase tracking-tight">
                                Calorías
                            </h3>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <span className="text-5xl font-black italic tracking-tighter tabular-nums text-white">
                            {calories}
                        </span>
                        <span className="text-sm font-black text-gray-500 uppercase mb-2">/ 1500 kcal</span>
                    </div>

                    <div className="space-y-2 mb-6">
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div 
                                className={`h-full transition-all duration-1000 ${calories > 1500 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-r from-orange-500 to-yellow-400'}`}
                                style={{ width: `${Math.min((calories / 1500) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-[9px] font-black uppercase italic text-gray-500 text-right">
                            {calories > 1500 ? '¡Te pasaste del límite!' : `Faltan ${1500 - calories} kcal`}
                        </p>
                    </div>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="Ej: 350"
                            value={customCalories}
                            onChange={(e) => setCustomCalories(e.target.value)}
                            className="flex-1 bg-black/50 text-white text-sm font-black px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-orange-500 transition-colors"
                        />
                        <button 
                            onClick={() => {
                                if(customCalories) {
                                    addCalories(Number(customCalories));
                                    setCustomCalories("");
                                }
                            }} 
                            className="px-6 py-3 bg-white/10 hover:bg-orange-500 text-white hover:text-black rounded-xl text-xs font-black uppercase transition-all border border-white/5 hover:border-orange-500"
                        >
                            Sumar
                        </button>
                        <button 
                            onClick={() => {setCalories(0); saveToLocal(null,null,null,undefined,undefined,0);}} 
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 flex items-center justify-center"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                    
                    {!fastingStart && (
                        <button 
                            onClick={handleEndDayAndFast}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2"
                        >
                            <Moon size={18} /> Finalizar Día e Iniciar Ayuno
                        </button>
                    )}
                </div>
            </div>

            {/* MÓDULO DE AYUNO AVANZADO */}
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-colors duration-1000 ${fastingStart ? 'bg-indigo-500/20' : 'bg-yellow-500/20'}`}></div>
                
                <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-3xl ${fastingStart ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-yellow-400/20 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]'}`}>
                                {fastingStart ? <Moon size={24} className="animate-pulse"/> : <Sun size={24}/>}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1">
                                    {fastingStart ? 'Cronómetro de Ayuno' : 'Estado: Puedes Comer'}
                                </p>
                                <h3 className="text-2xl font-black italic uppercase tracking-tight">
                                    {fastingStart ? 'En Proceso' : 'Ayuno Inactivo'}
                                </h3>
                            </div>
                        </div>
                        {fastingStart && (
                            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black text-gray-500 uppercase">Meta</p>
                                <p className="text-xs font-black italic text-yellow-400">{fastingGoal}h</p>
                            </div>
                        )}
                    </div>

                    {fastingStart ? (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-2 items-baseline">
                                <div className="text-center">
                                    <span className="text-5xl font-black italic tracking-tighter tabular-nums">{String(elapsedTime.hours).padStart(2, '0')}</span>
                                    <p className="text-[8px] font-black uppercase text-gray-600 mt-1">HRS</p>
                                </div>
                                <span className="text-4xl font-black text-gray-700 animate-pulse">:</span>
                                <div className="text-center">
                                    <span className="text-5xl font-black italic tracking-tighter tabular-nums">{String(elapsedTime.minutes).padStart(2, '0')}</span>
                                    <p className="text-[8px] font-black uppercase text-gray-600 mt-1">MIN</p>
                                </div>
                                <span className="text-4xl font-black text-gray-700 animate-pulse">:</span>
                                <div className="text-center">
                                    <span className="text-5xl font-black italic tracking-tighter tabular-nums text-indigo-400">{String(elapsedTime.seconds).padStart(2, '0')}</span>
                                    <p className="text-[8px] font-black uppercase text-gray-600 mt-1">SEG</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase italic text-gray-500 px-1">
                                    <span>Progreso</span>
                                    <span>{Math.round((elapsedTime.hours / fastingGoal) * 100)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-600 to-blue-400 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        style={{ width: `${Math.min((elapsedTime.hours / fastingGoal) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={stopFasting} className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                                    <RefreshCw size={14} /> Romper Ayuno
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-2">Meta</label>
                                    <select 
                                        value={fastingGoal} 
                                        onChange={(e) => {setFastingGoal(Number(e.target.value)); saveToLocal(null, null, null, undefined, Number(e.target.value));}}
                                        className="w-full bg-transparent text-sm font-black italic outline-none text-yellow-400"
                                    >
                                        {[12, 14, 16, 18, 20, 24].map(h => <option key={h} value={h} className="bg-black">{h} Horas</option>)}
                                    </select>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <label className="text-[8px] font-black text-gray-500 uppercase block mb-2">Empezó a las (Opcional):</label>
                                    <input 
                                        type="datetime-local" 
                                        id="fastStartInput"
                                        className="w-full bg-transparent text-[10px] font-black outline-none text-white appearance-none"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    const input = document.getElementById('fastStartInput');
                                    startFasting(input.value || null);
                                }} 
                                className="w-full py-5 bg-yellow-400 text-black rounded-3xl text-xs font-black uppercase hover:scale-[1.02] transition-all shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-2"
                            >
                                <Zap size={16} fill="black" /> Iniciar Ayuno Ahora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* PROGRESO DE PESO Y HÁBITOS DIARIOS */}
        <div className="max-w-5xl mx-auto mb-4 grid md:grid-cols-2 gap-6">
            
            {/* HÁBITOS DIARIOS */}
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-lg flex flex-col justify-center">
                <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                    <CheckSquare size={14}/> Hábitos Diarios
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => toggleHabit('water')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.water ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        <Droplets size={24} />
                        <span className="text-[9px] font-black uppercase text-center">3L Agua</span>
                    </button>
                    <button 
                        onClick={() => toggleHabit('creatine')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.creatine ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        <FlaskConical size={24} />
                        <span className="text-[9px] font-black uppercase text-center">Creatina</span>
                    </button>
                    <button 
                        onClick={() => toggleHabit('protein')}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${habits.protein ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                        <Dumbbell size={24} />
                        <span className="text-[9px] font-black uppercase text-center">Proteína</span>
                    </button>
                </div>
            </div>

            {/* REGISTRO DE PESO */}
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-lg relative overflow-hidden flex flex-col justify-center">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-3 px-2">
                            <span className="text-gray-500">Inicio: {profile.initialWeight}kg</span>
                            <span className="text-yellow-400 text-lg italic tracking-tighter">Actual: {profile.currentWeight}kg</span>
                            <span className="text-green-500">Meta: {profile.targetWeight}kg</span>
                        </div>
                        <div className="h-4 w-full bg-black rounded-full overflow-hidden border border-white/10 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-500 to-green-400 transition-all duration-1000 relative"
                                style={{ width: `${weightProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-3 italic">
                            Faltan {Math.max(profile.currentWeight - profile.targetWeight, 0).toFixed(1)}kg
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto md:border-l border-white/10 md:pl-6">
                        <button 
                            onClick={() => { setWeightInput(profile.currentWeight); setShowWeightModal(true); }}
                            className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all shadow-xl flex items-center gap-2 ${needsWeightUpdate ? 'bg-yellow-400 text-black shadow-yellow-400/20 animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Scale size={16} /> Pesarme
                        </button>
                        
                        <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-center flex flex-col gap-1">
                            {profile.lastWeightUpdate ? (
                                <>
                                    <p className="text-gray-500">Último: <span className="text-white">{weightDatesInfo?.last}</span></p>
                                    {needsWeightUpdate ? (
                                        <p className="text-yellow-400 animate-pulse">¡Toca hoy!</p>
                                    ) : (
                                        <p className="text-gray-500">Próximo: <span className="text-yellow-400">{weightDatesInfo?.next}</span> <span className="opacity-50">({weightDatesInfo?.daysLeft}d)</span></p>
                                    )}
                                </>
                            ) : (
                                <p className="text-yellow-400 animate-pulse">Sin registros</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </header>

      {/* NAV DIAS */}
      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-y border-white/5 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto flex gap-2 px-4 justify-start md:justify-center">
          {Object.keys(workout).map(day => (
            <button 
              key={day}
              onClick={() => setActiveTab(day)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex-shrink-0 ${activeTab === day ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-gray-500 hover:text-white'}`}
            >
              {day}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-8">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter">{workout[activeTab].name}</h2>
            <div className="flex items-center gap-3">
                {/* INDICADOR DE MES DE PROGRESO */}
                {!workout[activeTab].isRest && (
                    <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30">
                        <TrendingUp size={14} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                            Nivel {currentMonthLevel}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/20">
                    {workout[activeTab].isRest ? <HeartPulse size={14} className="text-red-500" /> : <Dumbbell size={14} className="text-yellow-400" />}
                    <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">
                        {workout[activeTab].isRest ? 'Día de Recuperación' : 'Plan Acero'}
                    </span>
                </div>
            </div>
        </div>

        {/* DOMINGO: REPOSICIÓN */}
        {workout[activeTab].isRest && (
            <section className="space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-[3rem] p-12 text-center">
                    <AlertCircle className="text-yellow-400 mx-auto mb-6" size={48} />
                    <h3 className="text-3xl font-black italic uppercase text-white mb-4">¿Te faltó algún día esta semana?</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto font-medium mb-10 leading-relaxed uppercase tracking-tight">
                        Si no pudiste entrenar un día anterior, este es el momento de reponerlo.
                    </p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        {['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(day => (
                            <button 
                                key={day}
                                onClick={() => setActiveTab(day)}
                                className="group bg-white/5 border border-white/5 p-6 rounded-3xl hover:bg-yellow-400 hover:border-yellow-400 transition-all flex flex-col items-center"
                            >
                                <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-black/50 mb-1">{day}</span>
                                <span className="text-sm font-black italic uppercase text-white group-hover:text-black">{workout[day].name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* LISTADO DE FUERZA (PESAS) */}
        {!workout[activeTab].isRest && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {workout[activeTab].exs.map((ex, i) => {
                    const { s: dynSets, r: dynReps } = getProgressedStats(ex.s, ex.r, currentMonthLevel);

                    return (
                    <div key={i} className="bg-[#111] rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col group hover:border-yellow-400/20 transition-all">
                        <div className="h-28 relative cursor-pointer" onClick={() => setPreviewExercise(ex)}>
                            <img src={ex.img} className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"></div>
                            <div className="absolute bottom-3 left-5">
                                <h4 className="text-sm font-black italic uppercase text-white leading-tight">{ex.n}</h4>
                                <p className="text-[9px] font-bold text-gray-500 uppercase">{dynReps} Reps • {dynSets} Series</p>
                            </div>
                        </div>
                        <div className="p-4 bg-black/20">
                            <div className="grid grid-cols-4 gap-2">
                                {[...Array(dynSets)].map((_, idx) => {
                                    const isChecked = completedSets[`${activeTab}-${ex.n}-${idx}`];
                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => toggleSet(ex.n, idx)}
                                            className={`h-10 rounded-xl border transition-all flex items-center justify-center font-black italic text-[10px] ${isChecked ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20 scale-105' : 'bg-white/5 border-white/10 text-gray-600 hover:border-white/20'}`}
                                        >
                                            {isChecked ? <CheckCircle2 size={12}/> : idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        )}

        {/* CIRCUITO DE CARDIO SIN IMPACTO + VIDEO */}
        {!workout[activeTab].isRest && (
            <section className="bg-[#0a0a0a] rounded-[3rem] border border-white/5 p-6 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -ml-32 -mt-32"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                    <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tight text-blue-500 mb-2">Cardio sin Impacto</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">3 Vueltas • Sigue el video y la tabla</p>
                    </div>
                    <div className="flex gap-2 bg-white/5 p-2 rounded-3xl">
                        {[1, 2, 3].map(v => (
                            <button 
                                key={v}
                                onClick={() => { setCurrentRound(v); saveToLocal(null, null, v); }}
                                className={`px-4 py-2 rounded-2xl font-black italic text-[10px] transition-all ${currentRound === v ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-white'}`}
                            >
                                VUELTA {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                    
                    {/* COLUMNA IZQUIERDA: VIDEO Y TIMER */}
                    <div className="space-y-6">
                        <div className="bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-inner">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#111]">
                                <div className="flex items-center gap-2 text-red-500">
                                    <Youtube size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Guía de Hoy</span>
                                </div>
                                <span className="text-[9px] text-gray-500 font-bold uppercase italic tracking-tighter">{activeTab.toUpperCase()}</span>
                            </div>
                            
                            <div className="aspect-video w-full bg-[#111] flex items-center justify-center relative">
                                {profile.dailyVideos && profile.dailyVideos[activeTab] && profile.dailyVideos[activeTab].trim() !== "" ? (
                                    <iframe 
                                        className="w-full h-full absolute inset-0"
                                        src={profile.dailyVideos[activeTab].replace("watch?v=", "embed/")} 
                                        title="Entrenamiento Cardio"
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="text-center p-8">
                                        <Youtube className="text-gray-700 mx-auto mb-4" size={40} />
                                        <p className="text-[10px] font-black uppercase text-gray-600 mb-2">Aún no hay video para hoy</p>
                                        <button onClick={() => setShowSettings(true)} className="text-[9px] text-yellow-400 font-black uppercase border-b border-yellow-400/30 pb-1">
                                            Añadir enlace en Ajustes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TIMER CARDIO */}
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Cronómetro de Intervalos</h4>
                            <div className="text-6xl font-black italic tracking-tighter mb-4 text-blue-400">
                                00:{String(cardioTimer).padStart(2, '0')}
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <button 
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className={`px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all flex items-center gap-2 ${isTimerRunning ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                                >
                                    {isTimerRunning ? 'Pausar' : 'Iniciar'} <Play size={14} />
                                </button>
                                <button 
                                    onClick={() => { setCardioTimer(45); setTimerMode('work'); setIsTimerRunning(false); }}
                                    className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 text-gray-400 transition-all"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: LISTA DE EJERCICIOS */}
                    <div className="space-y-4">
                        {impactFreeCardio.map(c => {
                            const isCompleted = completedCardio[`${activeTab}-r${currentRound}-${c.id}`];
                            return (
                                <div key={c.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCompleted ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPreviewExercise({ n: c.n, img: c.img })}>
                                        <img src={c.img} className="w-12 h-12 rounded-xl object-cover opacity-50 grayscale group-hover:opacity-100 transition-all" />
                                        <div>
                                            <h5 className="text-sm font-black italic text-white uppercase">{c.n}</h5>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{c.goal}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => toggleCardio(c.id)} 
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105' : 'bg-white/10 text-gray-500 hover:bg-white/20'}`}
                                    >
                                        <CheckCircle2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </section>
        )}

        {/* BOTÓN FINALIZAR (REGISTRAR) */}
        <div className="mt-8 border-t border-white/10 pt-12 flex flex-col items-center text-center">
             <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">
                Al finalizar, el progreso de hoy se guardará en tu historial y las casillas se reiniciarán.
            </p>
            <button 
                onClick={() => finalizeWorkout()}
                className="group relative w-full max-w-sm overflow-hidden rounded-[2rem] p-1 transition-all hover:scale-105"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-green-500 to-yellow-400 animate-pulse"></div>
                <div className="relative bg-black px-8 py-6 rounded-[1.8rem] flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-400 group-hover:animate-bounce" size={24} />
                    <span className="text-xl font-black italic uppercase text-white tracking-tighter">
                        {workout[activeTab].isRest ? 'Marcar Descanso' : 'Finalizar Entrenamiento'}
                    </span>
                </div>
            </button>
        </div>

      </main>

      {/* MODAL CONFIGURACIÓN (AJUSTES) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                        <Settings className="text-yellow-400" /> Ajustes del Perfil
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Pesos */}
                    <section>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Metas y Progreso</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Inicial (kg)</label>
                                <input type="number" value={profile.initialWeight} onChange={e => setProfile({...profile, initialWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-white outline-none" />
                            </div>
                            <div className="bg-black p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Actual (kg)</label>
                                <input type="number" value={profile.currentWeight} onChange={e => setProfile({...profile, currentWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-yellow-400 outline-none" />
                            </div>
                            <div className="bg-black p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">Peso Meta (kg)</label>
                                <input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full bg-transparent text-xl font-black text-green-500 outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* Links de YouTube */}
                    <section>
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Youtube size={14}/> Enlaces de Video Diario</h3>
                        <p className="text-[9px] text-gray-400 mb-4 italic">Pega aquí el enlace de YouTube para cada día (Ej: https://www.youtube.com/watch?v=...)</p>
                        <div className="space-y-3">
                            {['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(day => (
                                <div key={day} className="flex items-center gap-3 bg-black p-2 rounded-xl border border-white/5 focus-within:border-yellow-400/50 transition-all">
                                    <span className="w-12 text-[9px] font-black uppercase text-center text-gray-500 bg-white/5 py-2 rounded-lg">{day}</span>
                                    <input 
                                        type="text" 
                                        placeholder="Pegar enlace de video..."
                                        value={profile.dailyVideos?.[day] || ''} 
                                        onChange={e => setProfile({...profile, dailyVideos: {...profile.dailyVideos, [day]: e.target.value}})} 
                                        className="flex-1 bg-transparent text-xs font-medium text-white outline-none placeholder:text-gray-700" 
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/50">
                    <button onClick={() => saveSettings(profile)} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider hover:bg-yellow-300 transition-all">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL HISTORIAL (AGRUPADO POR MES) */}
      {showHistory && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
                        <History className="text-blue-500" /> Historial de Progreso
                    </h2>
                    <button onClick={() => setShowHistory(false)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-[#0a0a0a]">
                    {Object.keys(groupedHistory).length === 0 ? (
                        <div className="text-center py-12 text-gray-600">
                            <Medal size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-black uppercase italic">Aún no hay registros</p>
                            <p className="text-[10px]">Tus entrenamientos finalizados aparecerán aquí.</p>
                        </div>
                    ) : (
                        Object.entries(groupedHistory).map(([monthYear, records]) => (
                            <div key={monthYear} className="mb-8 relative">
                                {/* ENCABEZADO DE MES FIJO AL HACER SCROLL */}
                                <div className="sticky top-[-24px] z-10 bg-[#0a0a0a]/90 backdrop-blur-md py-3 mb-4 border-b border-white/10">
                                    <h3 className="text-sm font-black text-yellow-400 uppercase tracking-[0.2em]">{monthYear}</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {records.map((record) => (
                                        <div key={record.id} className="bg-[#111] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{record.dateString}</p>
                                                <h4 className="text-sm md:text-lg font-black italic text-white leading-tight">{record.dayName}</h4>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="bg-green-500/10 text-green-500 px-2 py-1 md:px-3 rounded-lg text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1">
                                                    <CheckCircle2 size={12}/> {record.dayKey === 'peso' ? 'Registro' : record.dayKey === 'calorias' ? 'Cierre Día' : 'Completado'}
                                                </span>
                                                <button onClick={() => deleteHistoryRecord(record.id)} className="text-gray-600 hover:text-red-500 p-2 shrink-0">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
      )}

      {/* MODAL REGISTRO DE PESO */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/50">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
                        <Scale className="text-yellow-400" /> Tu Peso Hoy
                    </h2>
                    <button onClick={() => setShowWeightModal(false)} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-8 flex flex-col items-center bg-[#0a0a0a]">
                    <div className="text-center mb-6">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                            Registro cada 7 días
                        </p>
                        {profile.lastWeightUpdate && (
                            <p className="text-[9px] font-bold text-gray-400 uppercase bg-white/5 px-3 py-1 rounded-full inline-block">
                                Última vez: <span className="text-white">{weightDatesInfo?.last}</span>
                            </p>
                        )}
                    </div>
                    
                    <div className="relative mb-8">
                        <input 
                            type="number" 
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            className="w-40 text-center bg-transparent text-6xl font-black italic outline-none text-yellow-400 border-b-2 border-yellow-400/30 pb-2 focus:border-yellow-400 transition-colors"
                            autoFocus
                        />
                        <span className="absolute right-2 bottom-4 text-xl font-black text-gray-600 uppercase italic">kg</span>
                    </div>

                    <button 
                        onClick={handleUpdateWeight}
                        className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black italic uppercase tracking-wider hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                    >
                        Guardar Registro
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL PARA VER IMAGEN DEL EJERCICIO */}
      {previewExercise && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95" onClick={() => setPreviewExercise(null)}>
            <div className="relative w-full max-w-2xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setPreviewExercise(null)} 
                    className="absolute -top-12 right-0 md:-right-12 p-2 text-gray-400 hover:text-white transition-colors bg-black/50 rounded-full"
                >
                    <X size={24} />
                </button>
                
                <img 
                    src={previewExercise.img} 
                    alt={previewExercise.n} 
                    className="w-full max-h-[60vh] object-cover rounded-[2rem] shadow-2xl border border-white/10"
                />
                
                <div className="mt-6 text-center">
                    <h3 className="text-3xl font-black italic uppercase text-yellow-400 tracking-tighter">
                        {previewExercise.n}
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase mt-2 tracking-widest">
                        Toca afuera o en la 'X' para cerrar
                    </p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
