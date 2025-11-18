const { useState, useEffect, useRef } = React;

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App = () => {
  const [discs, setDiscs] = useState([]);
  const [targetNumber, setTargetNumber] = useState(1);
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing');
  const [message, setMessage] = useState("");
  const [showRules, setShowRules] = useState(true);

  const initGame = () => {
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
    const shuffled = shuffleArray(numbers);
    const newDiscs = shuffled.map((num, index) => ({
      id: index,
      number: num,
      isRevealed: false,
      isTempRevealed: false,
    }));
    setDiscs(newDiscs);
    setTargetNumber(1);
    setGameStatus('playing');
    setMessage("Encuentra el 1");
    setIsFlipping(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleDiscClick = (clickedDisc) => {
    if (isFlipping || clickedDisc.isRevealed || gameStatus === 'won') return;
    if (clickedDisc.number === targetNumber) {
      setDiscs(prev => prev.map(d =>
        d.id === clickedDisc.id ? { ...d, isRevealed: true } : d
      ));
      const nextTarget = targetNumber + 1;
      if (nextTarget > 10) {
        setGameStatus('won');
        setMessage("¡Ganaste! 🎉");
        triggerConfetti();
      } else {
        setTargetNumber(nextTarget);
        setMessage(`¡Bien! Ahora encuentra el ${nextTarget}`);
      }
    } else {
      setIsFlipping(true);
      setMessage(`¡Ups! Ese es el ${clickedDisc.number}`);
      setDiscs(prev => prev.map(d =>
        d.id === clickedDisc.id ? { ...d, isTempRevealed: true } : d
      ));
      setTimeout(() => {
        setDiscs(prev => prev.map(d =>
          d.id === clickedDisc.id ? { ...d, isTempRevealed: false } : d
        ));
        setIsFlipping(false);
        setMessage(`Busca el ${targetNumber}`);
      }, 1000);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#d4a373', '#eab308', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#d4a373', '#eab308', '#ffffff']
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Memoria de Madera</h1>
        <p className="text-xl text-gray-600 font-medium h-8 transition-all duration-300">
          {message}
        </p>
      </div>
      <div className="relative bg-white rounded-3xl shadow-xl p-4 md:p-8 w-full max-w-2xl border-4 border-gray-100">
        <button 
          onClick={initGame}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Reiniciar Juego"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 py-4">
          {discs.map((disc) => (
            <div key={disc.id} className="relative w-20 h-20 md:w-24 md:h-24">
              <div className="absolute inset-0 rounded-full table-ring box-border opacity-20 pointer-events-none bg-gray-50 transform scale-110"></div>
              <div 
                className="w-full h-full perspective-1000 cursor-pointer group"
                onClick={() => handleDiscClick(disc)}
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${disc.isRevealed || disc.isTempRevealed ? 'rotate-y-180' : ''}`}>
                  <div className="absolute w-full h-full backface-hidden">
                    <div className="w-full h-full rounded-full wood-texture wood-grain shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <div className="w-16 h-16 rounded-full border border-yellow-900/10 opacity-50"></div>
                    </div>
                  </div>
                  <div className="absolute w-full h-full backface-hidden rotate-y-180">
                    <div className={`w-full h-full rounded-full border-4 ${disc.isRevealed ? 'bg-green-50 border-green-600' : 'bg-white border-gray-800'} shadow-inner flex items-center justify-center`}>
                      <span className={`text-4xl font-bold ${disc.isRevealed ? 'text-green-700' : 'text-gray-900'}`}>
                        {disc.number}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 text-gray-500 text-sm text-center max-w-md">
        El juego se reinicia automáticamente si le das al botón de recarga. 
        <br/>¡Intenta memorizar las posiciones cuando te equivoques!
      </div>
      {gameStatus === 'won' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center transform animate-bounce-in">
            <h2 className="text-5xl mb-4">🏆</h2>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">¡Excelente!</h3>
            <p className="text-gray-600 mb-6">Has completado la secuencia perfecta.</p>
            <button 
              onClick={initGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
            >
              Jugar de Nuevo
            </button>
          </div>
        </div>
      )}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Cómo jugar</h3>
            <div className="text-gray-700 space-y-2">
              <p>Encuentra los números del 1 al 10 en orden.</p>
              <p>Si te equivocas, verás el número brevemente.</p>
              <p>Usa el botón de recarga para reiniciar la partida.</p>
              <p>Ganas al descubrir todos los números.</p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-primary hover:bg-dark text-white font-semibold py-2 px-4 rounded-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
