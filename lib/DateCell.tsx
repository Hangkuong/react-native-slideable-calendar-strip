import { format } from 'date-fns';
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Props {
    item: any,
    isActive: boolean
    cellColor?: string
    width: number
    onPress: (item: any) => void
    cellActiveColor?: string
}

const DateCell = ({ item, isActive, onPress, cellColor, cellActiveColor, width }: Props) => {
    const solar = format(item, 'D')
    const defualtCellColor = 'white'
    const defualtCellActiveColor = '#1a73e8'
    const defualtCellTextColor = '#202124'
    const defualtCellActiveTextColor = 'white'
    return (
        <TouchableOpacity
            style={[styles.dateCell, {width: width / 7}]}
            onPress={onPress}
        >
            <View style={[
                styles.dateCellButton,
                { backgroundColor: isActive ? cellActiveColor || defualtCellActiveColor : cellColor || defualtCellColor || defualtCellColor }
            ]}>
                <Text style={[
                    styles.dateCellLabel,
                    { color: isActive ? cellActiveColor || defualtCellActiveTextColor : cellColor || cellColor || defualtCellTextColor }
                ]}>{solar}</Text>

            </View>
        </TouchableOpacity>
    )
}

export default DateCell

const styles = StyleSheet.create({
    dateContainer: {
        justifyContent: 'space-evenly',
    },
    dateCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateCellButton: {
        // paddingTop: 4,
        // width: 44,
        padding: 12,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateCellLabel: {
        // fontSize: 15,
        // lineHeight: Platform.OS === 'ios' ? 19 : 15,
    },
})
