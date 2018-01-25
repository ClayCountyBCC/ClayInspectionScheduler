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

    public CalendarDate()
    {

    }

  }

}