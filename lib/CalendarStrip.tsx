import React, { Component } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Weeks from 'react-native-slideable-calendar-strip/lib/Weeks';
import {
  format,
  addDays,
  subDays,
  eachDay,
  isFuture,
  isSameDay,
  endOfWeek,
  startOfWeek,
  differenceInDays,
} from 'date-fns';
import DateCell from 'react-native-slideable-calendar-strip/lib/DateCell';

interface Props {
  isKhmer: boolean
  onSwipeDown: any
  selectedDate: Date
  cellColor?: string
  cellActiveColor?: string
  weekStartsOn: Array<string>
  onPressDate: (item: any) => void
  calendarWidth?: number
}

interface State {
  data: any,
  pageOfToday: number,
  currentPage: number,
  isTodayVisible: boolean,
  itemWidth: number,
}

const screenWidth = Dimensions.get('window').width;
const ITEM_LENGTH = screenWidth / 7;
const _today = new Date();
const _year = _today.getFullYear();
const _month = _today.getMonth();
const _day = _today.getDate();
const TODAY = new Date(_year, _month, _day); // FORMAT: Wed May 16 2018 00:00:00 GMT+0800 (CST)

class CalendarStrip extends Component<Props, State> {
  _calendar: FlatList<any>;
  _panResponder: any;
  constructor(props) {
    super(props);
    this.state = {
      data: this.getInitialDates(props.weekStartsOn),
      isTodayVisible: true,
      pageOfToday: 2, // page of today in calendar, start from 0
      currentPage: 2, // current page in calendar,  start from 0
      itemWidth: this.props.calendarWidth / 7,
    };
  }

  componentWillMount() {
    const touchThreshold = 50;
    const speedThreshold = 0.2;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dy, vy } = gestureState;
        if (dy > touchThreshold && vy > speedThreshold) {
          const { onSwipeDown } = this.props;
          onSwipeDown && onSwipeDown();
        }
        return false;
      },
      onPanResponderRelease: () => { },
    });
  }


  componentWillReceiveProps(nextProps) {
    if (isSameDay(nextProps.selectedDate, this.props.selectedDate)) return;
    const nextSelectedDate = nextProps.selectedDate;
    if (!this.currentPageDatesIncludes(nextSelectedDate)) {
      const sameDay = (d) => isSameDay(d, nextSelectedDate);
      if (this.state.data.find(sameDay)) {
        let selectedIndex = this.state.data.findIndex(sameDay);
        if (selectedIndex === -1) selectedIndex = this.state.pageOfToday; // in case not find
        const selectedPage = ~~(selectedIndex / 7);
        this.scrollToPage(selectedPage);
      } else {
        if (isFuture(nextSelectedDate)) {
          const head = this.state.data[0];
          const tail = endOfWeek(nextSelectedDate, { weekStartsOn: nextProps.weekStartsOn });
          const days = eachDay(head, tail);
          this.setState({
            data: days,
            isTodayVisible: false,
          }, () => {
            const page = ~~(days.length / 7 - 1);
            // to last page
            this.scrollToPage(page);
          });
        } else {
          const head = startOfWeek(nextSelectedDate, { weekStartsOn: nextProps.weekStartsOn });
          const tail = this.state.data[this.state.data.length - 1];
          const days = eachDay(head, tail);
          this.setState({
            data: days,
            isTodayVisible: false,
          }, () => {
            this.scrollToPage(0);
          });
        }
      }
    }
  }

  scrollToPage = (page, animated = true) => {
    this._calendar.scrollToIndex({ animated, index: 7 * page });
  }

  currentPageDatesIncludes = (date) => {
    const { currentPage } = this.state;
    const currentPageDates = this.state.data.slice(7 * currentPage, 7 * (currentPage + 1));
    return !!currentPageDates.find(d => isSameDay(d, date));
  }

  getInitialDates(weekStartsOn = 0) {
    // const todayInWeek = getDay(TODAY);
    const last2WeekOfToday = subDays(TODAY, 7 * 2);
    const next2WeekOfToday = addDays(TODAY, 7 * 2);
    const startLast2Week = startOfWeek(last2WeekOfToday, { weekStartsOn });
    const endNext2Week = endOfWeek(next2WeekOfToday, { weekStartsOn });
    const eachDays = eachDay(startLast2Week, endNext2Week);
    return eachDays;
  }

  loadNextTwoWeek(originalDates) {
    const originalFirstDate = originalDates[0];
    const originalLastDate = originalDates[originalDates.length - 1];
    const lastDayOfNext2Week = addDays(originalLastDate, 7 * 2);
    const eachDays = eachDay(originalFirstDate, lastDayOfNext2Week);
    this.setState({ data: eachDays });
  }

  loadPreviousTwoWeek(originalDates) {
    const originalFirstDate = originalDates[0];
    const originalLastDate = originalDates[originalDates.length - 1];
    const firstDayOfPrevious2Week = subDays(originalFirstDate, 7 * 2);
    const eachDays = eachDay(firstDayOfPrevious2Week, originalLastDate);
    this.setState(prevState => ({
      data: eachDays,
      currentPage: prevState.currentPage + 2,
      pageOfToday: prevState.pageOfToday + 2,
    }), () => {
      this.scrollToPage(2, false);
    });
  }

  momentumEnd = (event) => {
    const firstDayInCalendar = this.state.data ? this.state.data[0] : new Date();
    const daysBeforeToday = differenceInDays(firstDayInCalendar, new Date());
    const pageOfToday = ~~(Math.abs(daysBeforeToday / 7));
    const screenWidth = event.nativeEvent.layoutMeasurement.width;
    const currentPage = event.nativeEvent.contentOffset.x / screenWidth;
    this.setState({
      pageOfToday,
      currentPage,
      isTodayVisible: currentPage === pageOfToday,
    });

    // swipe to head ~ load 2 weeks
    if (event.nativeEvent.contentOffset.x < screenWidth) {
      this.loadPreviousTwoWeek(this.state.data);
    }
  }

  onEndReached() {
    this.loadNextTwoWeek(this.state.data);
  }



  render() {
    const { isKhmer, onPressDate, selectedDate, weekStartsOn, calendarWidth } = this.props;

    // const menuArr: { name: string; image: any }[][] = [];
    // while (this.state.data.length) {
    //   menuArr.push(this.state.data.splice(0, 7));
    // } 

    // console.log(`menuArr`, menuArr)

    return (
      <View style={[styles.container, { width: calendarWidth || screenWidth }]}>
        <Weeks isKhmer={isKhmer || false} weekStartsOn={weekStartsOn || 0} width={this.props.calendarWidth || screenWidth} />
        <FlatList
          ref={ref => this._calendar = ref}
          bounces={false}
          horizontal
          pagingEnabled
          initialScrollIndex={14}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={this.momentumEnd}
          scrollEventThrottle={500}
          getItemLayout={(data, index) => (
            {
              length: this.state.itemWidth || ITEM_LENGTH,
              offset: this.state.itemWidth || ITEM_LENGTH * index, index
            }
          )}
          onEndReached={() => { this.onEndReached(); }}
          onEndReachedThreshold={0.01}
          data={this.state.data}
          extraData={this.state}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) =>
            <DateCell
              item={item}
              width={this.props.calendarWidth || screenWidth}
              isActive={isSameDay(selectedDate, item)}
              onPress={() => onPressDate && onPressDate(item)}
            />
          }
        />
      </View>
    );
  }

}

// CalendarStrip.propTypes = {
//   selectedDate: PropTypes.object.isRequired,
//   onPressDate: PropTypes.func,
//   onPressGoToday: PropTypes.func,
//   onSwipeDown: PropTypes.func,
//   isKhmer: PropTypes.bool,
//   showWeekNumber: PropTypes.bool,
//   weekStartsOn: PropTypes.number,
// };

// CalendarStrip.defaultProps = {
//   isKhmer: false,
//   showWeekNumber: false,
//   weekStartsOn: 0,
// };

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // width: screenWidth,
    marginTop: 12,
    alignSelf: 'center',
    // paddingHorizontal: 200,
    // marginHorizontal: 200,
    // height: 30+30+50,
    // justifyContent: 'space-evenly',
  },
});

export default CalendarStrip;
