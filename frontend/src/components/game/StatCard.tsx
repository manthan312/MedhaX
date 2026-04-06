import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, color = 'text-white' }) => {
  return (
    <View className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 flex-1 m-1 items-center justify-center min-h-[90px]">
      <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 text-center">
        {label}
      </Text>
      <Text className={`text-xl font-black text-center ${color}`}>
        {value}
      </Text>
      {subValue && (
        <Text className="text-slate-400 text-[10px] mt-1 text-center italic">
          {subValue}
        </Text>
      )}
    </View>
  );
};

export default StatCard;
