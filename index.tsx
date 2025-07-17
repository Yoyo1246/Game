/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';
import {useState, useEffect, useCallback} from 'react';
import ReactDOM from 'react-dom/client';

// --- Helper function to calculate Tic-Tac-Toe winner ---
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

// --- Tic Tac Toe Game Component ---
const TicTacToe = ({onBack}) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (i) => {
    if (winner || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (isDraw) {
    status = 'It\'s a Draw!';
  } else {
    status = `Next player: ${isXNext ? 'X' : 'O'}`;
  }

  const renderSquare = (i) => {
    const player = board[i];
    return (
        <button className="square" onClick={() => handleClick(i)} aria-label={`Square ${i}`}>
            {player && <span className={`player-${player}`}>{player}</span>}
        </button>
    );
  };

  return (
    <div className="game-container">
      <h2>Tic-Tac-Toe</h2>
      <p className="game-status">{status}</p>
      <div className="tic-tac-toe-board">
        {Array(9).fill(null).map((_, i) => renderSquare(i))}
      </div>
      <div className="game-controls">
        <button onClick={resetGame}>Play Again</button>
        <button onClick={onBack} className="back-button">Back to Games</button>
      </div>
    </div>
  );
};

// --- Rock Paper Scissors Game Component ---
const RockPaperScissors = ({onBack}) => {
  const CHOICES = ['Rock', 'Paper', 'Scissors'];
  const EMOJIS = {'Rock': '✊', 'Paper': '✋', 'Scissors': '✌️'};
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('Choose your move!');
  const [loading, setLoading] = useState(false);

  const playGame = async (choice) => {
    setLoading(true);
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult('Gemini is thinking...');

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Choose Rock, Paper, or Scissors. Your answer must be one word only.',
        config: {thinkingConfig: {thinkingBudget: 0}}
      });

      let aiChoice = response.text.trim();
      if (!CHOICES.includes(aiChoice)) {
        aiChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
      }
      setComputerChoice(aiChoice);

      if (choice === aiChoice) {
        setResult("It's a tie!");
      } else if (
        (choice === 'Rock' && aiChoice === 'Scissors') ||
        (choice === 'Paper' && aiChoice === 'Rock') ||
        (choice === 'Scissors' && aiChoice === 'Paper')
      ) {
        setResult('You win!');
      } else {
        setResult('You lose!');
      }
    } catch (error) {
      console.error('Error playing game:', error);
      setResult('Oops! Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-container rps-game">
      <h2>Rock, Paper, Scissors</h2>
      <p className="game-status">{result}</p>
      <div className="rps-choices">
        <div className="rps-player">
          <h3>You</h3>
          <div className="rps-emoji">{playerChoice ? EMOJIS[playerChoice] : '?'}</div>
        </div>
        <div className="rps-player">
          <h3>Gemini</h3>
          <div className="rps-emoji">{loading ? '...' : (computerChoice ? EMOJIS[computerChoice] : '?')}</div>
        </div>
      </div>
      <div className="options-container">
        {CHOICES.map((choice) => (
          <button key={choice} onClick={() => playGame(choice)} disabled={loading}>
            {choice} {EMOJIS[choice]}
          </button>
        ))}
      </div>
      <button onClick={onBack} className="back-button">Back to Games</button>
    </div>
  );
};


// --- Flip Card Memory Game Component ---
const MemoryGame = ({ onBack }) => {
    const EMOJIS = ['🧠', '🕹️', '👾', '🚀', '🤖', '🎲', '🧩', '🏆'];
    const POWERS = [
        { id: 'peek', name: 'Peek', emoji: '👀', description: 'Briefly reveal 3 random cards.' },
        { id: 'extraTurn', name: 'Extra Turn', emoji: '🔄', description: 'Take an extra turn.' },
        { id: 'shuffle', name: 'Shuffle', emoji: '🔀', description: 'Shuffle all unmatched cards.' },
        { id: 'steal', name: 'Steal Point', emoji: '💸', description: 'Steal 1 point from your opponent.' },
        { id: 'block', name: 'Block', emoji: '🛡️', description: "Block opponent's next power use." },
    ];

    const generateShuffledCards = () => {
        const duplicatedEmojis = [...EMOJIS, ...EMOJIS];
        return duplicatedEmojis
            .map((value, index) => ({ id: index, value, isFlipped: false, isMatched: false }))
            .sort(() => Math.random() - 0.5);
    };

    const [gameMode, setGameMode] = useState(null);
    const [cards, setCards] = useState(generateShuffledCards());
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [moves, setMoves] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(1);
    const [scores, setScores] = useState({ 1: 0, 2: 0 });
    const [playerPowers, setPlayerPowers] = useState({ 1: [], 2: [] });
    const [hasExtraTurn, setHasExtraTurn] = useState(false);
    const [blockedPlayer, setBlockedPlayer] = useState(null);
    const [peekedIndices, setPeekedIndices] = useState([]);

    const isGameOver = matchedPairs === EMOJIS.length;

    const dealPowers = () => {
        const shuffledPowers = [...POWERS].sort(() => 0.5 - Math.random());
        const p1Powers = shuffledPowers.slice(0, 2).map(p => ({ ...p, used: false }));
        const p2Powers = shuffledPowers.slice(2, 4).map(p => ({ ...p, used: false }));
        setPlayerPowers({ 1: p1Powers, 2: p2Powers });
    };

    const resetGame = useCallback(() => {
        setCards(generateShuffledCards());
        setFlippedCards([]);
        setMatchedPairs(0);
        setMoves(0);
        setTimer(0);
        setIsTimerActive(false);
        setCurrentPlayer(1);
        setScores({ 1: 0, 2: 0 });
        setIsChecking(false);
        setHasExtraTurn(false);
        setBlockedPlayer(null);
        if (gameMode === 'power') {
            dealPowers();
        }
    }, [gameMode]);

    const handleModeSelect = (mode) => {
        setGameMode(mode);
        if (mode === 'power') {
             const shuffledPowers = [...POWERS].sort(() => 0.5 - Math.random());
             const p1Powers = shuffledPowers.slice(0, 2).map(p => ({ ...p, used: false }));
             const p2Powers = shuffledPowers.slice(2, 4).map(p => ({ ...p, used: false }));
             setPlayerPowers({ 1: p1Powers, 2: p2Powers });
        }
        resetGame(); // resetGame will handle its own logic based on the now-set gameMode
    };

    // Timer logic
    useEffect(() => {
        let interval;
        if (isTimerActive && !isGameOver) {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, isGameOver]);
    
    // Check for matches
    useEffect(() => {
        if (flippedCards.length === 2) {
            setIsChecking(true);
            setMoves(prev => prev + 1);
            const [first, second] = flippedCards;
            
            if (cards[first].value === cards[second].value) {
                // Match
                setMatchedPairs(prev => prev + 1);
                setCards(prevCards => prevCards.map(card => 
                    card.value === cards[first].value ? { ...card, isMatched: true } : card
                ));
                if (gameMode === '2player' || gameMode === 'power') {
                    setScores(prev => ({...prev, [currentPlayer]: prev[currentPlayer] + 1}));
                }
                setFlippedCards([]);
                setIsChecking(false);
            } else {
                // No Match
                setTimeout(() => {
                    setCards(prevCards => prevCards.map((card, index) =>
                        index === first || index === second ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedCards([]);
                    if ((gameMode === '2player' || gameMode === 'power') && !hasExtraTurn) {
                        setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
                    }
                    setHasExtraTurn(false); // Reset extra turn after use
                    setIsChecking(false);
                }, 1000);
            }
        }
    }, [flippedCards, cards, gameMode, currentPlayer, hasExtraTurn]);

    // Clear block status on player turn change
    useEffect(() => {
        if (blockedPlayer === currentPlayer) {
            setBlockedPlayer(null);
        }
    }, [currentPlayer, blockedPlayer]);

    const handleCardClick = (index) => {
        if (isChecking || cards[index].isFlipped || flippedCards.length === 2 || isGameOver) {
            return;
        }
        if (gameMode === 'timer' && !isTimerActive) setIsTimerActive(true);
        setCards(prevCards => prevCards.map((card, i) => i === index ? { ...card, isFlipped: true } : card));
        setFlippedCards(prev => [...prev, index]);
    };

    const handleUsePower = (powerId) => {
        const playerPower = playerPowers[currentPlayer].find(p => p.id === powerId);
        if (!playerPower || playerPower.used || isChecking) return;

        // Mark power as used
        setPlayerPowers(prev => ({
            ...prev,
            [currentPlayer]: prev[currentPlayer].map(p => p.id === powerId ? { ...p, used: true } : p)
        }));

        switch(powerId) {
            case 'peek':
                const unrevealedIndices = cards
                    .map((card, index) => (card.isFlipped || card.isMatched ? -1 : index))
                    .filter(index => index !== -1);
                const shuffledUnrevealed = unrevealedIndices.sort(() => 0.5 - Math.random());
                const indicesToPeek = shuffledUnrevealed.slice(0, 3);
                setPeekedIndices(indicesToPeek);
                setTimeout(() => setPeekedIndices([]), 2000);
                break;
            case 'extraTurn':
                setHasExtraTurn(true);
                break;
            case 'shuffle':
                const unmatchedCards = cards.filter(c => !c.isMatched);
                const shuffledValues = unmatchedCards.map(c => c.value).sort(() => Math.random() - 0.5);
                let valueIndex = 0;
                const newCards = cards.map(c => {
                    if (!c.isMatched) {
                        return { ...c, value: shuffledValues[valueIndex++] };
                    }
                    return c;
                });
                setCards(newCards);
                break;
            case 'steal':
                const opponent = currentPlayer === 1 ? 2 : 1;
                if(scores[opponent] > 0) {
                    setScores(prev => ({
                        ...prev,
                        [currentPlayer]: prev[currentPlayer] + 1,
                        [opponent]: prev[opponent] - 1
                    }));
                }
                break;
            case 'block':
                const opponentToBlock = currentPlayer === 1 ? 2 : 1;
                setBlockedPlayer(opponentToBlock);
                break;
            default: break;
        }
    };

    const renderGameInfo = () => {
         if (isGameOver) {
            if (gameMode === 'timer') {
                return <p className="game-status feedback-text">Game Over! You won in {moves} moves and {timer} seconds.</p>;
            } else { 
                const winner = scores[1] > scores[2] ? 'Player 1' : (scores[2] > scores[1] ? 'Player 2' : 'It\'s a Tie!');
                return <p className="game-status feedback-text">Game Over! {winner === 'It\'s a Tie!' ? winner : `${winner} wins!`}</p>;
            }
        }

        if (gameMode === 'timer') {
            return <div className="memory-info"><span>Moves: {moves}</span><span>Time: {timer}s</span></div>;
        }
        
        if (gameMode === '2player' || gameMode === 'power') {
            const renderPlayerInfo = (playerNum) => (
                <div className={`player-info ${currentPlayer === playerNum ? 'current-player' : ''}`}>
                    <span className="player-score">P{playerNum}: {scores[playerNum]}</span>
                    {gameMode === 'power' && (
                        <div 
                            className={`player-powers ${blockedPlayer === playerNum ? 'blocked' : ''}`}
                            data-blocked-tooltip={blockedPlayer === playerNum ? 'Powers Blocked!' : ''}
                        >
                            {playerPowers[playerNum].map(power => (
                                <button
                                    key={power.id}
                                    className={`power-card ${power.used ? 'used' : ''}`}
                                    onClick={() => handleUsePower(power.id)}
                                    disabled={power.used || currentPlayer !== playerNum || isChecking || blockedPlayer === playerNum}
                                    data-tooltip={power.description}
                                >
                                    {power.emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
            return (
                <div className="memory-info player-scores">
                    {renderPlayerInfo(1)}
                    <span className="game-status">{`Player ${currentPlayer}'s Turn`}</span>
                    {renderPlayerInfo(2)}
                </div>
            );
        }
        return null;
    };


    if (!gameMode) {
        return (
            <div className="game-container">
                <h2>Memory Game</h2>
                <p>Select a game mode to start.</p>
                <div className="mode-selector">
                    <button onClick={() => handleModeSelect('timer')}>Timer Mode</button>
                    <button onClick={() => handleModeSelect('2player')}>2-Player Mode</button>
                    <button onClick={() => handleModeSelect('power')}>Power Mode (2P)</button>
                </div>
                <button onClick={onBack} className="back-button">Back to Games</button>
            </div>
        );
    }
    
    return (
        <div className="game-container">
            <h2>Memory Game</h2>
            {renderGameInfo()}
            <div className="memory-board">
                {cards.map((card, index) => (
                    <div 
                        key={card.id} 
                        className={`memory-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''} ${peekedIndices.includes(index) ? 'peeked' : ''}`}
                        onClick={() => handleCardClick(index)}
                    >
                        <div className="card-face card-back"></div>
                        <div className="card-face card-front">{card.value}</div>
                    </div>
                ))}
            </div>
             <div className="game-controls">
                <button onClick={resetGame}>New Game</button>
                <button onClick={() => setGameMode(null)}>Change Mode</button>
                <button onClick={onBack} className="back-button">Back to Games</button>
            </div>
        </div>
    );
};


// --- Main App Component ---
function App() {
  const [view, setView] = useState('home');

  const renderView = () => {
    switch (view) {
      case 'tic-tac-toe':
        return <TicTacToe onBack={() => setView('home')} />;
      case 'rock-paper-scissors':
        return <RockPaperScissors onBack={() => setView('home')} />;
      case 'memory-game':
        return <MemoryGame onBack={() => setView('home')} />;
      case 'home':
      default:
        return (
          <div className="game-menu">
            <h1>Game On! 🎮</h1>
            <p>Select a game to play and test your skills.</p>
            <div className="game-grid">
               <button className="game-card" onClick={() => setView('tic-tac-toe')}>
                  <div className="game-card-image-container">
                    <img src="https://assets.codepen.io/217233/tictactoe.png" alt="Tic-Tac-Toe game board" className="game-card-image" />
                  </div>
                  <h3 className="game-card-title">Tic-Tac-Toe</h3>
                  <p className="game-card-description">The classic challenge of Xs and Os.</p>
                </button>
                <button className="game-card" onClick={() => setView('rock-paper-scissors')}>
                   <div className="game-card-image-container">
                    <img src="https://assets.codepen.io/217233/rps.png" alt="Rock, Paper, and Scissors icons" className="game-card-image" />
                   </div>
                  <h3 className="game-card-title">Rock, Paper, Scissors</h3>
                  <p className="game-card-description">Can you beat the Gemini AI?</p>
                </button>
                <button className="game-card" onClick={() => setView('memory-game')}>
                   <div className="game-card-image-container">
                    <img src="https://assets.codepen.io/217233/memory.png" alt="Brain icon for Memory Game" className="game-card-image" />
                   </div>
                   <h3 className="game-card-title">Memory Game</h3>
                   <p className="game-card-description">Flip cards to match pairs. Play with timers or powers!</p>
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main>
      {renderView()}
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);