using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.Caching;
using Newtonsoft.Json;

namespace ClayInspectionScheduler.Models
{
  public class DateCache
  {
    private DateTime baseMinDate { get; set; }
    private DateTime baseMaxDate { get;  set; }
    private DateTime maxDate { get; set; }

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
    [JsonIgnore]
    public List<DateTime> goodDates { get; set; } = new List<DateTime>();
    private List<DateTime> badDates { get; set; } = new List<DateTime>();
    public List<string> badDates_string
    {
      get
      {
        return (from b in badDates
                select b.ToShortDateString()).ToList();
      }
    }
    
    private void SetMaxDate(DateTime MaxScheduleDate, bool ContractorOnNotice)
    {
      // do all the funky stuff in here
      if (MaxScheduleDate >= goodDates.First() && MaxScheduleDate < goodDates.Last() && ContractorOnNotice)
      {
        maxDate = MaxScheduleDate;
        //goodDates.RemoveAll(x => x > SuspendGraceDt);
      }
      else
      {
        maxDate = goodDates.Last();
      }

    }
    public static DateCache CacheDates(bool IsExternalUser)
    {
      return new DateCache(IsExternalUser);
    }

    public DateCache(bool IsExternalUser)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@Start", IsExternalUser ? DateTime.Today.AddDays(1) : DateTime.Today);
      dbArgs.Add("@End", IsExternalUser ? DateTime.Today.AddDays(9) : DateTime.Today.AddDays(15));

      string sql = @"
        USE CALENDAR;

        SELECT 
          calendar_date,
          observed_holiday,
          day_of_week 
        FROM Dates
        WHERE calendar_date BETWEEN @Start AND @End";

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

    }

    public static DateCache getDateCache(bool IsExternalUser, DateTime MaxScheduleDate, bool ContractorOnNotice)
    {
      var CIP = new CacheItemPolicy() { AbsoluteExpiration = DateTime.Today.AddDays(1) };
      var dc = (DateCache)MyCache.GetItem("datecache," + IsExternalUser.ToString(), CIP);
      dc.SetMaxDate(MaxScheduleDate, ContractorOnNotice);
      return dc;
    }


  }


}


