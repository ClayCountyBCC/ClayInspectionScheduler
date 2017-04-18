using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace InspectionScheduler.Models
{
  public class Dates
  {

    public static List<DateTime> getHolidayList( int vYear )
    {
      // This function is used to get a list of holidays for a given year.

      int FirstWeek = 1;
      int SecondWeek = 2;
      int ThirdWeek = 3;
      int FourthWeek = 4;
      int LastWeek = 5;

      List<System.DateTime> HolidayList = new List<System.DateTime> ( );

      //   http://www.usa.gov/citizens/holidays.shtml      
      //   http://archive.opm.gov/operating_status_schedules/fedhol/2013.asp

      // New Year's Day            Jan 1
      HolidayList.Add ( new DateTime ( vYear, 1, 1 ) );

      // Martin Luther King, Jr. third Mon in Jan
      HolidayList.Add ( GetNthDayOfNthWeek ( new DateTime ( vYear, 1, 1 ), ( int ) DayOfWeek.Monday, ThirdWeek ) );

      // Washington's Birthday third Mon in Feb
      HolidayList.Add ( GetNthDayOfNthWeek ( new DateTime ( vYear, 2, 1 ), ( int ) DayOfWeek.Monday, ThirdWeek ) );

      // Memorial Day          last Mon in May
      HolidayList.Add ( GetNthDayOfNthWeek ( new DateTime ( vYear, 5, 1 ), ( int ) DayOfWeek.Monday, LastWeek ) );

      // Independence Day      July 4
      HolidayList.Add ( new DateTime ( vYear, 7, 4 ) );

      // Labor Day             first Mon in Sept
      HolidayList.Add ( GetNthDayOfNthWeek ( new DateTime ( vYear, 9, 1 ), ( int ) DayOfWeek.Monday, FirstWeek ) );

      // Columbus Day          second Mon in Oct
      //HolidayList.Add(GetNthDayOfNthWeek(new DateTime(vYear, 10, 1), DayOfWeek.Monday, SecondWeek))

      // Veterans Day          Nov 11
      HolidayList.Add ( new DateTime ( vYear, 11, 11 ) );

      // Thanksgiving Day      fourth Thur in Nov
      System.DateTime ThanksGiving = GetNthDayOfNthWeek ( new DateTime ( vYear, 11, 1 ), ( int ) DayOfWeek.Thursday, FourthWeek );
      HolidayList.Add ( ThanksGiving );
      HolidayList.Add ( ThanksGiving.AddDays ( +1 ) );
      switch ( vYear )
      {
        case 2014:
          // Christmas Eve         Dec 24
          HolidayList.Add ( new DateTime ( vYear, 12, 26 ) );
          // for 2014, the holidays are set to 12/25 and 12/26
          break;
        default:
          // Christmas Eve         Dec 24
          HolidayList.Add ( new DateTime ( vYear, 12, 24 ) );
          break;
      }

      // Christmas Day         Dec 25
      HolidayList.Add ( new DateTime ( vYear, 12, 25 ) );

      //saturday holidays are moved to Fri; Sun to Mon
      for ( int i = 0; i <= HolidayList.Count - 1; i++ )
      {
        System.DateTime dt = HolidayList [ i ];
        if ( dt.DayOfWeek == DayOfWeek.Saturday )
        {
          HolidayList [ i ] = dt.AddDays ( -1 );
        }
        if ( dt.DayOfWeek == DayOfWeek.Sunday )
        {
          HolidayList [ i ] = dt.AddDays ( 1 );
        }
      }
      return HolidayList;

    }

    private static DateTime GetNthDayOfNthWeek( DateTime dt, int DayofWeek, int WhichWeek )
    {
      //specify which day of which week of a month and this function will get the date
      //this function uses the month and year of the date provided

      //get first day of the given date
      DateTime dtFirst = new DateTime ( dt.Year, dt.Month, 1 );
      //get first DayOfWeek of the month
      DateTime dtRet = dtFirst.AddDays ( 6 - ( int ) dtFirst.AddDays ( -( DayofWeek + 1 ) ).DayOfWeek );

      //get which week
      dtRet = dtRet.AddDays ( ( WhichWeek - 1 ) * 7 );

      //if day is past end of month then adjust backwards a week
      if ( dtRet >= dtFirst.AddMonths ( 1 ) )
      {
        dtRet = dtRet.AddDays ( -7 );
      }

      //return
      return dtRet;

    }

    public static List<DateTime> GenerateDates(bool IsExternalUser = true)
    {
      try
      {


        var dTmp = DateTime.Today;

        // external rules: 
        // can't schedule same day
        // can't schedule on weekends
        // can't schedule on holidays

        // internal rules
        // can't schedule on holidays
        var datesToReturn = new List<DateTime>();
        var badDates = new List<DateTime>();
        var goodDates = new List<DateTime>();
        var holidays = getHolidayList(dTmp.Year);
        if (dTmp.Year != dTmp.AddDays(8).Year)
        {
          holidays.AddRange(getHolidayList(dTmp.Year + 1));
        }

        badDates = (from h in holidays
                    where h >= dTmp &&
                    h <= dTmp.AddDays(8)
                    select h).ToList();
        
        for (int i = (IsExternalUser ? 1 : 0); i < ( IsExternalUser ? 9: 18); i++)
        {
          var t = dTmp.AddDays(i);
          if (!badDates.Contains(t))
          {
            if (IsExternalUser)
            {
              if (t.DayOfWeek == DayOfWeek.Saturday ||
                t.DayOfWeek == DayOfWeek.Sunday)
              {
                badDates.Add(t);
              }
              else
              {
                goodDates.Add(t);
              }
            }
            else
            {
              goodDates.Add(t);
            }
          }
        }

        var minDate = (from d in goodDates orderby d select d).First();
        var maxDate = (from d in goodDates orderby d descending select d).First();
        datesToReturn.Add(minDate);
        datesToReturn.AddRange((from d in badDates
                                where d >= minDate &&
                                d <= maxDate
                                select d).ToList());
        datesToReturn.Add(maxDate);
        return datesToReturn;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }
    }

    public static List<string> GenerateShortDates(bool IsExternalUser)
    {
      return (from d in GenerateDates(IsExternalUser)
              select d.ToShortDateString()).ToList();
    }

    //public static string disabledDatesString()
    //{

    //  List<DateTime> badDates = generateDates( );
    //  string dateList = "[";
    //  for ( int i = 0; i < badDates.Count - 1; i++ )
    //  {
    //    dateList += badDates [ i ].Month + "/" + badDates [ i ].Day + "/" + badDates [ i ].Year + ", ";
    //  }

    //  dateList += badDates [ badDates.Count -1 ].Month + "/" + badDates [ badDates.Count -1  ].Day + "/" + badDates [ badDates.Count - 1 ].Year + "]";

    //  return dateList;

    //}

  }
}