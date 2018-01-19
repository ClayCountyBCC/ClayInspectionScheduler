using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClayInspectionScheduler.Models
{
  public class DateCache
  {
    private DateTime baseMinDate { get; set; }
    private DateTime baseMaxDate { get; set; }
    private DateTime maxDate { get; set; }
    private DateTime SuspendGraceDate { get; set; } = DateTime.MinValue;

    public string minDate_string
    {
      get
      {
        return baseMinDate.ToShortDateString();
      }
    }
    public string maxDate_string
    {
      get
      {
        return maxDate.ToShortDateString();
      }
    }
    private List<DateTime> goodDates { get; set; } = new List<DateTime>();
    private List<DateTime> badDates { get; set; } = new List<DateTime>();
    public List<string> badDates_string
    {
      get
      {
        return (from b in badDates
                select b.ToShortDateString()).ToList();
      }
    }
    
    public void SetMaxDate()
    {
      if (SuspendGraceDate >= goodDates.First())
      {
        goodDates.RemoveAll(x => x > SuspendGraceDate);
      }
      // do all the funky stuff in here
      if (SuspendGraceDate >= goodDates.First())
      {
        goodDates.RemoveAll(x => x > SuspendGraceDate);
      }

      if (goodDates.Count() == 1 && baseMaxDate == DateTime.MinValue)
      {

      }
      else
      {
        maxDate = goodDates.Last();
      }

    }

    public DateCache (bool isExternal)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@Start", isExternal ? DateTime.Today.AddDays(1) : DateTime.Today);
      dbArgs.Add("@End", isExternal ? DateTime.Today.AddDays(9) : DateTime.Today.AddDays(15));

      string sql = @"
        USE CALENDAR;

        SELECT 
          calendar_date,
          observed_holiday,
          day_of_week 
        FROM Dates
        WHERE calendar_date BETWEEN @Start AND @End";
      try
      {
        var datelist = Constants.Get_Data<CalendarDate>(sql, dbArgs); // fix this

        
        badDates = (from d in datelist
                    where d.day_of_week == 1 ||
                     d.day_of_week == 7 ||
                     d.observed_holiday == 1
                    select d.calendar_date).ToList();

        goodDates = (from d in datelist
                     where d.day_of_week != 1 &&
                       d.day_of_week != 7 &&
                       d.observed_holiday != 1
                     select d.calendar_date).ToList();

        var dl = (from g in goodDates
                  orderby g ascending
                  select g);

        baseMinDate = dl.First();
        baseMaxDate = dl.Last();
      }catch(Exception ex)
      {
        // This area sets dates to Today during unless it is the weekend for Testing. Calendar DB does not exist in CLAYBCCIMSTRN\SQLEXPRESS.
        badDates = new List<DateTime>();

        goodDates = new List<DateTime>();

        if (DateTime.Today.DayOfWeek.ToString() != "Saturday" && DateTime.Today.DayOfWeek.ToString() != "Sunday")
        {
          goodDates.Add(DateTime.Today);
          baseMinDate = DateTime.Today;
          baseMaxDate = DateTime.Today;
        }
        else
        {
          goodDates.Add(DateTime.Today);
          baseMinDate = DateTime.Today;
          baseMaxDate = DateTime.MinValue;
        }
        Constants.Log(ex, sql);
      }
    }

    public static DateCache getDateCache(bool IsExternalUser, DateTime suspendGraceDate)
    {
      var dc = (DateCache)MyCache.GetItem("datecache," + IsExternalUser.ToString());
      dc.SuspendGraceDate = suspendGraceDate;
      dc.SetMaxDate();

      return dc;
    }


  }


}


