using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayInspectionScheduler.Models
{
  public class InspectionDates
  {

    public static List<DateTime> GetHolidayList(int vYear)
    {
      // This function is used to get a list of holidays for a given year.

      int FirstWeek = 1;
      //int SecondWeek = 2;
      int ThirdWeek = 3;
      int FourthWeek = 4;
      int LastWeek = 5;

      List<DateTime> HolidayList = new List<DateTime>
      {

        //   http://www.usa.gov/citizens/holidays.shtml      
        //   http://archive.opm.gov/operating_status_schedules/fedhol/2013.asp

        // New Year's Day            Jan 1
        new DateTime(vYear, 1, 1),

        // Martin Luther King, Jr. third Mon in Jan
        GetNthDayOfNthWeek(new DateTime(vYear, 1, 1), (int)DayOfWeek.Monday, ThirdWeek),

        // Washington's Birthday third Mon in Feb
        GetNthDayOfNthWeek(new DateTime(vYear, 2, 1), (int)DayOfWeek.Monday, ThirdWeek),

        // Memorial Day          last Mon in May
        GetNthDayOfNthWeek(new DateTime(vYear, 5, 1), (int)DayOfWeek.Monday, LastWeek),

        // Independence Day      July 4
        new DateTime(vYear, 7, 4),

        // Labor Day             first Mon in Sept
        GetNthDayOfNthWeek(new DateTime(vYear, 9, 1), (int)DayOfWeek.Monday, FirstWeek),

        // Columbus Day          second Mon in Oct
        //HolidayList.Add(GetNthDayOfNthWeek(new DateTime(vYear, 10, 1), DayOfWeek.Monday, SecondWeek))

        // Veterans Day          Nov 11
        new DateTime(vYear, 11, 11)
      };

      // Thanksgiving Day      fourth Thur in Nov
      DateTime ThanksGiving = GetNthDayOfNthWeek(new DateTime(vYear, 11, 1), (int)DayOfWeek.Thursday, FourthWeek);
      HolidayList.Add(ThanksGiving);
      HolidayList.Add(ThanksGiving.AddDays(+1));
      switch (vYear)
      {
        case 2014:
          // Christmas Eve         Dec 24
          HolidayList.Add(new DateTime(vYear, 12, 26));
          // for 2014, the holidays are set to 12/25 and 12/26
          break;
        default:
          // Christmas Eve         Dec 24
          HolidayList.Add(new DateTime(vYear, 12, 24));
          break;
      }

      // Christmas Day         Dec 25
      HolidayList.Add(new DateTime(vYear, 12, 25));
      if (vYear == 2017)
      {
        HolidayList.Add(new DateTime(vYear, 12, 26));  
      }

      //saturday holidays are moved to Fri; Sun to Mon
      for (int i = 0; i <= HolidayList.Count - 1; i++)
      {
        System.DateTime dt = HolidayList[i];
        if (dt.DayOfWeek == DayOfWeek.Saturday)
        {
          HolidayList[i] = dt.AddDays(-1);
        }
        if (dt.DayOfWeek == DayOfWeek.Sunday)
        {
          HolidayList[i] = dt.AddDays(1);
        }

      }
      return HolidayList;

    }

    private static DateTime GetNthDayOfNthWeek(DateTime dt, int DayofWeek, int WhichWeek)
    {
      //specify which day of which week of a month and this function will get the date
      //this function uses the month and year of the date provided

      //get first day of the given date
      DateTime dtFirst = new DateTime(dt.Year, dt.Month, 1);
      //get first DayOfWeek of the month
      DateTime dtRet = dtFirst.AddDays(6 - (int)dtFirst.AddDays(-(DayofWeek + 1)).DayOfWeek);

      //get which week
      dtRet = dtRet.AddDays((WhichWeek - 1) * 7);

      //if day is past end of month then adjust backwards a week
      if (dtRet >= dtFirst.AddMonths(1))
      {
        dtRet = dtRet.AddDays(-7);
      }

      //return
      return dtRet;

    }

    public static List<DateTime> GenerateDates(bool IsExternalUser, DateTime SuspendGraceDate)
    {
      try
      {


        var dTmp = DateTime.Today;
        if(SuspendGraceDate.Date < DateTime.Today.AddDays(1))
        {
          SuspendGraceDate = DateTime.MinValue;
        }
        // external rules: 
        // can schedule up to 9 days
        // can't schedule same day
        // can't schedule on weekends
        // can't schedule on holidays

        // internal rules
        // can't schedule on holidays
        // can schedule up to 15 days

        var datesToReturn = new List<DateTime>();
        var badDates = new List<DateTime>();
        var goodDates = new List<DateTime>();
        var holidays = GetHolidayList(dTmp.Year);
        int iUser = (IsExternalUser ? 9 : 15);
        if (dTmp.Year != dTmp.AddDays(iUser).Year)
        {
          holidays.AddRange(GetHolidayList(dTmp.Year + 1));
        }

        badDates = (from h in holidays
                    where h >= dTmp &&
                    h <= dTmp.AddDays(iUser)
                    select h).ToList();

        for (int i = (IsExternalUser ? 1 : 0); i < iUser; i++)
        {
          var t = dTmp.AddDays(i);
          if (!badDates.Contains(t))
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
        }



        var minDate = (from d in goodDates
                       orderby d
                       select d).First();

        var maxDate = (from d in goodDates
                       orderby d descending
                       select d).First();

        if(SuspendGraceDate > minDate &&  SuspendGraceDate < maxDate)
        {
          maxDate = SuspendGraceDate;
        }


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

    public static List<string> GenerateShortDates(bool IsExternalUser, DateTime SuspendGraceDate)
    {
      return (from d in GenerateDates(IsExternalUser, SuspendGraceDate)
              select d.ToShortDateString()).ToList();
    }
  }
}