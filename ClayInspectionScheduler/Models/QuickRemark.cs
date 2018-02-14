using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayInspectionScheduler.Models
{
  public class QuickRemark
  {
    public string Remark { get; set; }
    public bool Commercial { get; set; }
    public bool Building { get; set; }
    public bool Electrical { get; set; }
    public bool Mechanical { get; set; }
    public bool Plumbing { get; set; }
    public bool PrivateProvider { get; set; }
    public QuickRemark()
    {

    }

    public static List<QuickRemark> GetInspectionQuickRemarks()
    {
      string query = @"
        SELECT 
          quick_remark Remark,
          commercial Commerical,
          building Building,
          electrical Electrical,
          mechanical Mechanical,
          plumbing Plumbing,
          private_provider PrivateProvider
        FROM bpInspectionQuickRemarks";
      return Constants.Get_Data<QuickRemark>(query);
    }

    public static List<QuickRemark> GetCachedInspectionQuickRemarks()
    {
      return (List<QuickRemark>)MyCache.GetItem("quickremarks");
    }
  }
}