using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;
using System.Collections;

namespace ClayInspectionScheduler.Models
{
  public class Hold
  {
    public string PermitNo { get; set; }
    public string HldCd { get; set; }
    public string HoldDesc { get; set; }
    public int SatFinalFlag { get; set; }
    public int SatNoInspection { get; set; }

    public Hold()
    {

    }

    public static List<Hold> Get(List<string> Permits)
    {
      string sql = @"
          USE WATSC;
          SELECT 
	          H.PermitNo,
 	          H.HldCd,
	          HR.HoldDesc,
	          HR.SatFinalFlg,
	          HR.SatNoInspection
          FROM bpHOLD H
          INNER JOIN bpHOLD_REF HR ON H.HldCd = HR.HoldCode
          WHERE 
            H.Deleted IS NULL 
            AND h.HldDate IS NULL
	          AND HR.Active = 1
	          AND	H.PermitNo IN @permits
            and (HR.SatFinalFlg = 1 or HR.SatNoInspection = 1)";
      try
      {
        using (IDbConnection db =
          new SqlConnection(Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"))))
        {
          var holds = db.Query<Hold>(sql, new { permits = Permits }).ToList();
          return holds;
        }
      }
      catch (Exception ex)
      {
        // TODO: no connection alert
        Constants.Log(ex, sql);
        return null;
      }
    }
  }
}
