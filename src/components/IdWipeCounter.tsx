
import React from 'react';
import GlassCard from './GlassCard';
import CountBadge from './CountBadge';

export interface ClanCount {
  clan: string;
  faction: string;
  count: number;
}

interface IdWipeCounterProps {
  data: ClanCount[];
  loading?: boolean;
}

const IdWipeCounter = ({ data, loading = false }: IdWipeCounterProps) => {
  // Group data by faction
  const factions = data.reduce((acc, item) => {
    if (!acc[item.faction]) {
      acc[item.faction] = [];
    }
    acc[item.faction].push(item);
    return acc;
  }, {} as Record<string, ClanCount[]>);

  if (loading) {
    return (
      <GlassCard className="min-h-[200px] flex items-center justify-center animate-pulse">
        <div className="text-glass-light">Loading clan data...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard animate className="border border-pink-300/30 shadow-lg shadow-pink-500/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">ClanID</h3>
        <span className="text-glass-light text-sm">เป็น ID ที่มีตระกูลเท่านั้น</span>
      </div>
      
      <div className="info-box">
        <div className="text-white text-sm leading-relaxed">
          <p className="mb-2"><span className="info-highlight">ID เริ่มต้น</span> ที่มีตระกูลอย่างเดียวเท่านั้น <span className="info-success">สะอาด</span> ประกันกุญแจ 2 วันหลังซื้อขาย</p>
          <p className="mb-2"><span className="text-blue-300 font-medium">ฝั่ง CCG:</span> ตัวละ <span className="info-highlight font-bold">30 บาท</span></p>
          <p className="mb-2"><span className="text-purple-300 font-medium">ฝั่ง Ghoul:</span> มี 2 ราคา</p>
          <ul className="list-disc list-inside pl-4 text-glass-light">
            <li>ตัวละ <span className="info-highlight font-bold">30 บาท</span></li>
            <li>สำหรับตัวละ <span className="info-highlight font-bold">50 บาท</span> แถม Rc <span className="info-success">8.5M ฟรี</span></li>
          </ul>
        </div>
      </div>
      
      <a
        href="https://www.facebook.com/is.Moyx"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="buy-link"
        className="custom-cursor relative z-10 inline-block bg-pink-300/20 hover:bg-pink-300/30 text-pink-300 font-bold border border-pink-300/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-300/20 px-4 py-1.5 rounded-full text-sm mb-6"
        onClick={(e) => {
          console.log('To Buy clicked, opening link: https://www.facebook.com/is.Moyx');
          e.stopPropagation();
        }}
      >
        To Buy
      </a>
      
      {Object.keys(factions).map((faction) => (
        <div key={faction} className="mb-6">
          <h4 className="text-lg font-medium text-pink-300 mb-4">{faction}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {factions[faction].map((item) => (
              <div 
                key={item.clan} 
                className="bg-glass-dark/50 backdrop-blur-sm p-4 rounded-lg border border-pink-300/20 transition-all duration-500 hover:shadow-lg hover:shadow-pink-300/30 hover:-translate-y-1 relative"
              >
                <div className="absolute inset-0 rounded-lg border border-pink-300/30 animate-border-glow pointer-events-none"></div>
                <h5 className="text-white font-medium mb-2">{item.clan}</h5>
                <div className="flex items-center justify-between">
                  <span className="text-glass-light text-sm">Available:</span>
                  <CountBadge 
                    count={item.count} 
                    className={`bg-pink-300/20 ${item.count === 0 ? 'text-red-500' : 'text-green-300'} border border-pink-300/30 animate-pulse-grow`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </GlassCard>
  );
};

export default IdWipeCounter;
