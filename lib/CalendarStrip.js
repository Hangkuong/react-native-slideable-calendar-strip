import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  FlatList,
  Platform,
  Dimensions,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import Weeks from './Weeks';
import {
  format,
  addDays,
  subDays,
  eachDay,
  isFuture,
  isSameDay,
  endOfWeek,
  getISOWeek,
  startOfWeek,
  differenceInDays,
} from 'date-fns';

const width = Dimensions.get('window').width;
const ITEM_LENGTH = width / 7;
const _today = new Date();
const _year = _today.getFullYear();
const _month = _today.getMonth();
const _day = _today.getDate();
const TODAY = new Date(_year, _month, _day); // FORMAT: Wed May 16 2018 00:00:00 GMT+0800 (CST)

class DateItem extends PureComponent {
  render() {
    const {
      item,
      highlight,
      onItemPress,
    } = this.props;
    const solar = format(item, 'D');
    const highlightBgColor = '#1a73e8';
    const normalBgColor = 'white';
    const hightlightTextColor = '#fff';
    const normalTextColor = 'rgba(0,0,0,0.9)';
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          underlayColor='#008b8b'
          style={styles.itemWrapButton}
          onPress={onItemPress}
        >
          <View style={[
            styles.itemView,
            // { paddingTop: 10 },
            {backgroundColor: highlight ? highlightBgColor : normalBgColor}
          ]}>
            <Text style={[
              styles.itemDateText,
              {color: highlight ? hightlightTextColor : normalTextColor}
            ]}>{solar}</Text>
           
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

class CalendarStrip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: this.getInitialDates(props.weekStartsOn),
      isTodayVisible: true,
      pageOfToday: 2, // page of today in calendar, start from 0
      currentPage: 2, // current page in calendar,  start from 0
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
      onPanResponderRelease: () => {},
    });
  }


  componentWillReceiveProps(nextProps) {
    if (isSameDay(nextProps.selectedDate, this.props.selectedDate)) return;
    const nextSelectedDate = nextProps.selectedDate;
    if (!this.currentPageDatesIncludes(nextSelectedDate)) {
      const sameDay = (d) => isSameDay(d, nextSelectedDate);
      if (this.state.datas.find(sameDay)) {
        let selectedIndex = this.state.datas.findIndex(sameDay);
        if (selectedIndex === -1) selectedIndex = this.state.pageOfToday; // in case not find
        const selectedPage = ~~(selectedIndex / 7);
        this.scrollToPage(selectedPage);
      } else {
        if (isFuture(nextSelectedDate)) {
          const head = this.state.datas[0];
          const tail = endOfWeek(nextSelectedDate, { weekStartsOn: nextProps.weekStartsOn });
          const days = eachDay(head, tail);
          this.setState({
            datas: days,
            isTodayVisible: false,
          }, () => {
            const page = ~~(days.length/7 - 1);
            // to last page
            this.scrollToPage(page);
          });
        } else {
          const head = startOfWeek(nextSelectedDate, { weekStartsOn: nextProps.weekStartsOn });
          const tail = this.state.datas[this.state.datas.length - 1];
          const days = eachDay(head, tail);
          this.setState({
            datas: days,
            isTodayVisible: false,
          }, () => {
            this.scrollToPage(0);
          });
        }
      }
    }
  }

  scrollToPage = (page, animated=true) => {
    this._calendar.scrollToIndex({ animated, index: 7 * page });
  }

  currentPageDatesIncludes = (date) => {
    const { currentPage } = this.state;
    const currentPageDates = this.state.datas.slice(7*currentPage, 7*(currentPage+1));
    return !!currentPageDates.find(d => isSameDay(d, date));
  }

  getInitialDates(weekStartsOn=0) {
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
    const originalLastDate = originalDates[originalDates.length-1];
    const lastDayOfNext2Week = addDays(originalLastDate, 7 * 2);
    const eachDays = eachDay(originalFirstDate, lastDayOfNext2Week);
    this.setState({ datas: eachDays });
  }

  loadPreviousTwoWeek(originalDates) {
    const originalFirstDate = originalDates[0];
    const originalLastDate = originalDates[originalDates.length-1];
    const firstDayOfPrevious2Week = subDays(originalFirstDate, 7 * 2);
    const eachDays = eachDay(firstDayOfPrevious2Week, originalLastDate);
    this.setState(prevState => ({
      datas: eachDays,
      currentPage: prevState.currentPage+2,
      pageOfToday: prevState.pageOfToday+2,
    }), () => {
      this.scrollToPage(2, false);
    });
  }



  render() {
    const {
      isKhmer,
      onPressDate,
      selectedDate,
      weekStartsOn,
    } = this.props;
    return (
      <View style={styles.container} {...this._panResponder.panHandlers}>
        <Weeks isKhmer={isKhmer} weekStartsOn={weekStartsOn} />
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
            {length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index}
          )}
          onEndReached={() => { this.onEndReached(); } }
          onEndReachedThreshold={0.01}
          data={this.state.datas}
          extraData={this.state}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) =>
            <DateItem
              item={item}
              onItemPress={() => onPressDate && onPressDate(item)}
              highlight={isSameDay(selectedDate, item)}
            />}
        />
      </View>
    );
  }

  momentumEnd = (event) => {
    const firstDayInCalendar = this.state.datas ? this.state.datas[0] : new Date();
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
    if (event.nativeEvent.contentOffset.x < width) {
      this.loadPreviousTwoWeek(this.state.datas);
    }
  }

  onEndReached() {
    this.loadNextTwoWeek(this.state.datas);
  }
}

CalendarStrip.propTypes = {
  selectedDate: PropTypes.object.isRequired,
  onPressDate: PropTypes.func,
  onPressGoToday: PropTypes.func,
  onSwipeDown: PropTypes.func,
  isKhmer: PropTypes.bool,
  showWeekNumber: PropTypes.bool,
  weekStartsOn: PropTypes.number,
};

CalendarStrip.defaultProps = {
  isKhmer: false,
  showWeekNumber: false,
  weekStartsOn: 0,
};

const styles = StyleSheet.create({
  container: {
    width,
    marginTop:12,
    // height: 30+30+50,
  },
  header: {
    // height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  headerDate: {
    color: 'gray',
    fontSize: 13,
  },
  headerDateWeek: {
    color: "#1a73e8",
    fontSize: 14,
  },
  headerGoTodayButton: {
    borderRadius: 10,
    width: 20, height: 20,
    backgroundColor: '#1a73e8',
    position: 'absolute', top: 5, right: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  todayText: {
    fontSize: 12,
    color: 'white',
  },
  itemContainer: {
    width: width / 7,
    height: 50,
  },
  itemWrapButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemView: {
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  itemDateText: {
    // fontSize: 15,
    // lineHeight: Platform.OS === 'ios' ? 19 : 15,
  },
  
  itemBottomDot: {
    width: 4,
    left: 20,
    height: 4,
    bottom: 4,
    borderRadius: 2,
    position: 'absolute',
  }
});

export default CalendarStrip;
