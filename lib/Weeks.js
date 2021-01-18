import React from 'react';
import {
  View,
  Text,
  Dimensions
} from 'react-native';
const width = Dimensions.get('window').width;
const WEEK = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const WEEK_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export default ({ isKhmer, weekStartsOn }) => {
  const week_localized = isKhmer ? WEEK : WEEK_en;
  const weekStartsOnMinnor = weekStartsOn % 7;
  const weekTranformed = [
    ...week_localized.slice(weekStartsOnMinnor),
    ...week_localized.slice(0, weekStartsOnMinnor),
  ];
  return (
    <View style={{
      width,
      height: 30,
      flexDirection: 'row',
    }}>
      {weekTranformed.map(day =>
        <View style={{
          flex: 1,
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }} key={day}>
          <Text style={{
            color: 'gray',
            fontSize: 12,
          }}>{day}</Text>
        </View>
      )}
    </View>
  );
}