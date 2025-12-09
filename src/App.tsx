import  { useState } from 'react';
import { RotateCw, Users, Table, ChevronRight, ChevronLeft, RefreshCw, ArrowRight } from 'lucide-react';

// ポジションの定義
type Position = {
  id: number; // 内部管理用ID (1-11)
  label: string; // 表示名
  name: string;
  type: 'court' | 'bench';
  displayOrder: number; // 表示順序制御用
};

// 循環ルートの定義: P2(前右) -> ベンチ(B5->B1) -> P1(サーブ) -> P6 -> ...
// 流れ: P2が終わった人がB5(入り口)へ、B1(出口)の人がP1へ

// 11個の「席」を定義します。
// id 1-6: コート, 7-11: ベンチ
const POSITIONS_DEF: Position[] = [
  { id: 2, label: 'P2', name: '前衛ライト', type: 'court', displayOrder: 2 },
  // P2の次はベンチへ
  { id: 7, label: 'B1', name: 'ベンチ1', type: 'bench', displayOrder: 7 },
  { id: 8, label: 'B2', name: 'ベンチ2', type: 'bench', displayOrder: 8 },
  { id: 9, label: 'B3', name: 'ベンチ3', type: 'bench', displayOrder: 9 },
  { id: 10, label: 'B4', name: 'ベンチ4', type: 'bench', displayOrder: 10 },
  { id: 11, label: 'B5', name: 'ベンチ5', type: 'bench', displayOrder: 11 },
  // ベンチから戻るのはP1(サーブ)
  { id: 1, label: 'P1', name: '後衛ライト(S)', type: 'court', displayOrder: 1 },
  // サーブを打ったらP6へ（コートに残る）
  { id: 6, label: 'P6', name: '後衛センター', type: 'court', displayOrder: 6 },
  { id: 5, label: 'P5', name: '後衛レフト', type: 'court', displayOrder: 5 },
  { id: 4, label: 'P4', name: '前衛レフト', type: 'court', displayOrder: 4 },
  { id: 3, label: 'P3', name: '前衛センター', type: 'court', displayOrder: 3 },
];

// 選手型
type Player = {
  id: string;
  name: string;
  number: string;
  role: string;
  startPosId: number; // 初期配置のポジションID (1-11)
};

// 初期データ 11人分
const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: '選手A', number: '1', role: 'Any', startPosId: 4 }, // P4開始
  { id: 'p2', name: '選手B', number: '2', role: 'Any', startPosId: 3 }, // P3開始
  { id: 'p3', name: '選手C', number: '3', role: 'Any', startPosId: 2 }, // P2開始
  { id: 'p4', name: '選手D', number: '4', role: 'Any', startPosId: 1 }, // P1開始
  { id: 'p5', name: '選手E', number: '5', role: 'Any', startPosId: 6 }, // P6開始
  { id: 'p6', name: '選手F', number: '6', role: 'Any', startPosId: 5 }, // P5開始
  // ベンチスタート (B1が小さい数、B5が大きい数になるよう配置)
  { id: 'p7', name: '選手G', number: '7', role: 'Any', startPosId: 7 }, // B1 (小さい数)
  { id: 'p8', name: '選手H', number: '8', role: 'Any', startPosId: 8 }, // B2
  { id: 'p9', name: '選手I', number: '9', role: 'Any', startPosId: 9 }, // B3
  { id: 'p10', name: '選手J', number: '10', role: 'Any', startPosId: 10 }, // B4
  { id: 'p11', name: '選手K', number: '11', role: 'Any', startPosId: 11 }, // B5 (大きい数)
];


export default function VolleyballRotationPlanner() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [currentRotation, setCurrentRotation] = useState(1); // 1-11
  const [viewMode, setViewMode] = useState<'court' | 'table'>('court');

  // ローテーションの「席順」定義 (時計回りの逆＝選手が進む順序)
  // 変更: P2 -> ベンチ(11..7) -> P1 -> P6 -> P5 -> P4 -> P3 -> P2
  // ベンチのID順: 11(B5) -> 10(B4) -> ... -> 7(B1)
  // つまり、P2から来た人はB5に入り、B5の人はB4へ... B1の人はP1へ出る
  const ROTATION_SEQUENCE = [2, 11, 10, 9, 8, 7, 1, 6, 5, 4, 3];

  // 特定のローテーションにおける各ポジションの選手を取得する関数
  const getPlayerAtPosition = (rotation: number, posId: number) => {
    // 1. 調べたいポジション(posId)が、シーケンスの何番目にあるか探す
    const seqIndex = ROTATION_SEQUENCE.indexOf(posId);
    if (seqIndex === -1) return undefined;

    // 2. ローテーション数に応じて、「誰がここに来るか」を逆算する
    // Rot1 (offset 0): そのまま
    // Rot2 (offset 1): 前の席にいた人が来る
    // 選手はシーケンス順に進むので、ある席(index)にいる選手は、
    // 初期配置において (index - (rotation - 1)) の場所にいた選手。
    const offset = rotation - 1;
    
    // 負の数に対応するためのモジュロ演算
    const len = ROTATION_SEQUENCE.length;
    const targetSeqIndex = ((seqIndex - offset) % len + len) % len;
    
    const targetStartPosId = ROTATION_SEQUENCE[targetSeqIndex];
    
    return players.find(p => p.startPosId === targetStartPosId);
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleNextRotation = () => {
    setCurrentRotation(prev => prev === 11 ? 1 : prev + 1);
  };

  const handlePrevRotation = () => {
    setCurrentRotation(prev => prev === 1 ? 11 : prev - 1);
  };

  // コート表示用コンポーネント
  const CourtView = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* コートエリア */}
      <div className="bg-orange-100 border-4 border-orange-300 p-2 sm:p-4 rounded-t-lg relative shadow-inner aspect-[9/9] sm:aspect-[9/6]">
        {/* ネット */}
        <div className="absolute top-1/3 left-0 right-0 h-1 bg-white z-10 flex items-center justify-center">
          <span className="bg-orange-300 text-white px-2 text-[10px] sm:text-xs rounded-full">NET / CENTER LINE</span>
        </div>
        
        {/* アタックライン */}
        <div className="absolute top-[55%] left-0 right-0 h-0.5 bg-orange-300/50 border-t border-dashed border-orange-400"></div>

        <div className="grid grid-cols-3 grid-rows-2 h-full gap-2 pt-6">
          {/* 前衛: 4, 3, 2 */}
          {[4, 3, 2].map(posId => {
            const player = getPlayerAtPosition(currentRotation, posId);
            return (
              <div key={posId} className="bg-white/90 rounded-lg p-1 sm:p-2 border-2 border-orange-200 flex flex-col items-center justify-center shadow-sm relative">
                 <span className="absolute top-0.5 left-1.5 text-[10px] font-bold text-orange-400">P{posId}</span>
                 {player ? (
                   <>
                     <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 shadow-md">
                       {player.number}
                     </div>
                     <div className="font-bold text-gray-800 text-xs sm:text-sm text-center leading-tight truncate w-full">{player.name}</div>
                   </>
                 ) : <span className="text-gray-400 text-xs">Empty</span>}
              </div>
            );
          })}

          {/* 後衛: 5, 6, 1 */}
          {[5, 6, 1].map(posId => {
             const player = getPlayerAtPosition(currentRotation, posId);
             return (
              <div key={posId} className={`bg-white/90 rounded-lg p-1 sm:p-2 border-2 ${posId === 1 ? 'border-yellow-400 bg-yellow-50' : 'border-orange-200'} flex flex-col items-center justify-center shadow-sm relative`}>
                 <span className="absolute top-0.5 left-1.5 text-[10px] font-bold text-orange-400">P{posId}</span>
                 {posId === 1 && <span className="absolute top-0.5 right-1.5 text-[10px] font-bold text-yellow-600 bg-yellow-200 px-1 rounded">Serve</span>}
                 {player ? (
                   <>
                     <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${player.role === 'L' ? 'bg-green-600' : 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm sm:text-lg mb-0.5 sm:mb-1 shadow-md`}>
                       {player.number}
                     </div>
                     <div className="font-bold text-gray-800 text-xs sm:text-sm text-center leading-tight truncate w-full">{player.name}</div>
                   </>
                 ) : <span className="text-gray-400 text-xs">Empty</span>}
              </div>
             );
          })}
        </div>
      </div>

      {/* ベンチエリア */}
      <div className="bg-gray-100 border-x-4 border-b-4 border-gray-300 p-3 rounded-b-lg">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
          Bench / Waiting Area
          <span className="text-[10px] font-normal text-gray-400 normal-case">(P2からベンチへ → ベンチからP1/サーブへ)</span>
        </h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {/* ベンチ表示順序: B5(大きい) -> ... -> B1(小さい) */}
          {[11, 10, 9, 8, 7].map((posId) => {
            const label = POSITIONS_DEF.find(p => p.id === posId)?.label;
            const player = getPlayerAtPosition(currentRotation, posId);
            return (
              <div key={posId} className="flex-shrink-0 w-16 sm:w-20 bg-white rounded border border-gray-300 p-2 flex flex-col items-center relative">
                <span className="absolute top-0.5 left-1 text-[10px] text-gray-400">{label}</span>
                {player ? (
                  <>
                     <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm mb-1">
                       {player.number}
                     </div>
                     <div className="text-[10px] sm:text-xs text-gray-700 text-center truncate w-full">{player.name}</div>
                  </>
                ) : <span className="text-xs text-gray-300">-</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 一覧表モード
  const SheetView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="p-2 border text-left whitespace-nowrap sticky left-0 bg-gray-800 z-10">Rot</th>
            {/* コート内 */}
            <th className="p-2 border text-center w-12 bg-blue-900">P4</th>
            <th className="p-2 border text-center w-12 bg-blue-900">P3</th>
            <th className="p-2 border text-center w-12 bg-blue-900">P2</th>
            <th className="p-2 border text-center w-12 bg-blue-800">P5</th>
            <th className="p-2 border text-center w-12 bg-blue-800">P6</th>
            <th className="p-2 border text-center w-12 bg-yellow-700">P1</th>
            {/* ベンチ: B5 -> B1 */}
            <th className="p-2 border text-center w-8 bg-gray-600 text-xs">B5</th>
            <th className="p-2 border text-center w-8 bg-gray-600 text-xs">B4</th>
            <th className="p-2 border text-center w-8 bg-gray-600 text-xs">B3</th>
            <th className="p-2 border text-center w-8 bg-gray-600 text-xs">B2</th>
            <th className="p-2 border text-center w-8 bg-gray-600 text-xs">B1</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 11 }, (_, i) => i + 1).map(rot => (
            <tr key={rot} className={rot === currentRotation ? "bg-blue-50 border-2 border-blue-400" : "hover:bg-gray-50"}>
              <td className="p-2 border font-bold text-center sticky left-0 bg-inherit">{rot}</td>
              {/* 表示順: P4, P3, P2, P5, P6, P1, B5...B1 */}
              {[4, 3, 2, 5, 6, 1, 11, 10, 9, 8, 7].map(posId => {
                const p = getPlayerAtPosition(rot, posId);
                const isBench = posId > 6;
                return (
                  <td key={posId} className={`p-1 border text-center ${isBench ? 'bg-gray-50 text-gray-500' : ''}`}>
                    {p ? (
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${isBench ? 'text-xs' : 'text-sm'}`}>{p.number}</span>
                        {!isBench && <span className="text-[10px] text-gray-500 truncate max-w-[40px]">{p.name}</span>}
                      </div>
                    ) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen font-sans text-gray-800">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <RefreshCw className="w-8 h-8" />
            11人制ローテーション
          </h1>
          <p className="text-sm text-gray-500">
            全員で回るローテーション（P2→ベンチ→P1）
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={() => setViewMode('court')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'court' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border'}`}
           >
             <RotateCw size={18} /> コート
           </button>
           <button 
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border'}`}
           >
             <Table size={18} /> 一覧表
           </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム：メンバー編集 */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-md font-bold mb-4 flex items-center gap-2 border-b pb-2">
            <Users size={20} />
            メンバー設定 (Start)
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {players.sort((a,b) => {
               // 編集画面での並び順: P4,3,2,5,6,1, B5...B1 (11..7)
               const displayOrder = [4,3,2,5,6,1, 11,10,9,8,7];
               return displayOrder.indexOf(a.startPosId) - displayOrder.indexOf(b.startPosId);
            }).map((player) => {
               const posLabel = POSITIONS_DEF.find(p => p.id === player.startPosId)?.label || '';
               const isBench = player.startPosId > 6;
               return (
                <div key={player.id} className={`p-2 rounded border ${isBench ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
                  <div className="flex justify-between items-center mb-1">
                     <span className={`text-[10px] font-bold uppercase ${isBench ? 'text-gray-400' : 'text-blue-500'}`}>
                       Start: {posLabel}
                     </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={player.number}
                      onChange={(e) => updatePlayer(player.id, 'number', e.target.value)}
                      className="w-10 text-center font-bold border rounded px-1 py-1 text-sm outline-none focus:border-blue-400"
                      placeholder="#"
                    />
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
                      placeholder="名前"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右カラム：メインビュー */}
        <div className="lg:col-span-2">
          {viewMode === 'court' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={handlePrevRotation}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Rotation</span>
                  <div className="text-3xl font-bold text-blue-900">{currentRotation} <span className="text-lg text-gray-400">/ 11</span></div>
                </div>
                <button 
                  onClick={handleNextRotation}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <CourtView />

              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                <strong>ローテーションの流れ:</strong>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  P2 <ArrowRight size={12}/> 
                  <span className="bg-gray-200 px-1 rounded text-gray-700">ベンチ(B5..B1)</span> 
                  <ArrowRight size={12}/> P1(S) <ArrowRight size={12}/> P6 <ArrowRight size={12}/> P5 <ArrowRight size={12}/> P4 <ArrowRight size={12}/> P3
                </div>
                <p className="mt-1 text-gray-600">※ 前衛ライト(P2)がベンチの入り口(B5)へ下がり、ベンチの出口(B1)がサーブ(P1)に入ります。</p>
              </div>
            </div>
          )}

          {viewMode === 'table' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
               <h3 className="text-lg font-bold mb-4">全ローテーション一覧 (11回転)</h3>
               <SheetView />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}