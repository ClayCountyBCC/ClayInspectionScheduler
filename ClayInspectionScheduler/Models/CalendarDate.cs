using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using System.Web;

namespace ClayInspectionScheduler.Models
{
  public class CalendarDate
  {
    public DateTime calendar_date { get; set; }
    public int observed_holiday { get; set; }
    public int day_of_week { get; set; }

    public static List<CalendarDate> GenerateDates(bool IsExternalUser, DateTime SuspendGraceDate)
    {

      // external rules: 
      // can schedule up to 9 days
      // can't schedule same day
      // can't schedule on weekends
      // can't schedule on holidays

      // internal rules
      // can't schedule on holidays
      // can schedule current day if weekday
      // can schedule up to 15 days

      // create two date lists and two dates
      // List 1: bad dates for internal users : holidays, weekends
      // List 2: bad dates for external users : today, holidays, weekends
      // date 1: internal max date : Today plus 15 days
      // date 2: external max date : Today plus 9 days


      var MinDateAddInt = IsExternalUser ? 1 : 0;
      var MaxDateAddInt = IsExternalUser ? 9 : 15;

      var dbArgs = new DynamicParameters();
      dbArgs.Add("@MIN_DATE_ADD_INT", MinDateAddInt);
      dbArgs.Add("@MAX_DATE_ADD_INT", MaxDateAddInt);

      string sql =
      @"USE CALENDAR;

        -- THESE ARE THE ACTUAL PARAMETERS I WOULD USE
        DECLARE @MIN_DATE DATE = CAST(DATEADD(dd,@MIN_DATE_ADD_INT, GETDATE())AS DATE);
        DECLARE @MAX_DATE DATE = CAST(DATEADD(dd,@MAX_DATE_ADD_INT, GETDATE())AS DATE);


        SELECT calendar_date,observed_holiday,day_of_week FROM Dates
        WHERE calendar_date BETWEEN @MIN_DATE AND @MAX_DATE";


      List<CalendarDate> dates = Constants.Get_Data<CalendarDate>(sql, dbArgs);

      return dates;
    }

    public static List<CalendarDate> GenerateShortDates(bool IsExternalUser, DateTime SuspendGraceDate)
    {

      return (from d in GenerateDates(IsExternalUser, SuspendGraceDate)
              select d).ToList();
    }

    public static List<string> GetCachedDates(bool IsExternalUser, DateTime SuspendGraceDate)
    {
      var CIP = new System.Runtime.Caching.CacheItemPolicy() { AbsoluteExpiration = DateTime.Today.AddDays(1) };
      var CachedCalendarDates = (List<CalendarDate>)MyCache.GetItem("calendardate," + IsExternalUser + "," + SuspendGraceDate, CIP);
      var mindate = CachedCalendarDates.First().calendar_date;
      var maxdate = SuspendGraceDate == DateTime.MinValue || SuspendGraceDate > CachedCalendarDates.Last().calendar_date? CachedCalendarDates.Last().calendar_date : SuspendGraceDate;

      var MinDate = (from cd in CachedCalendarDates
                     where cd.calendar_date <= maxdate &&
                           cd.observed_holiday != 1 &&
                          (cd.day_of_week != 1 && cd.day_of_week != 7)
                     select cd.calendar_date).First();

      var MaxDate = (from cd in CachedCalendarDates
                    where cd.calendar_date <= maxdate && 
                          cd.observed_holiday != 1 &&
                         (cd.day_of_week != 1 && cd.day_of_week != 7)
                    select cd.calendar_date).Last();

      if (SuspendGraceDate > MinDate && SuspendGraceDate < MaxDate)
      {
        MaxDate = SuspendGraceDate;
      }

      List<string> returnList = new List<string>
      {
        MinDate.ToShortDateString()
      };
      returnList.AddRange (from d in CachedCalendarDates
                           where d.calendar_date > MinDate &&
                                 d.calendar_date < MaxDate &&
                                (d.day_of_week == 1 || d.day_of_week == 7 || d.observed_holiday == 1)
                        select d.calendar_date.ToShortDateString());

      returnList.Add(MaxDate.ToShortDateString());

      return returnList;
                    
    }

  }

}