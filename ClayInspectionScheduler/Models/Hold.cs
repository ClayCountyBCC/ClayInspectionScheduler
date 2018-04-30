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
    public int SatFinalFlg { get; set; }
    public int SatNoInspection { get; set; }
    public bool AllowPreInspections { get; set; }

    public Hold()
    {

    }

    public static List<Hold> Get(List<string> Permits)
    {
      string sql = @"
          USE WATSC;

          WITH PermitBASEIDs (BASEID) AS (
            SELECT TOP 1 BASEID FROM bpBASE_PERMIT
            WHERE BASEID IN 
              (SELECT DISTINCT BASEID FROM bpMASTER_PERMIT WHERE PERMITNO IN @permits
               UNION
               SELECT DISTINCT BASEID FROM bpASSOC_PERMIT WHERE PERMITNO IN  @permits))

          SELECT 
	          H.PermitNo,
            H.BaseId,
 	          H.HldCd,
	          HR.HoldDesc,
	          HR.SatFinalFlg,
	          HR.SatNoInspection,
            HR.AllowPreInspections
          FROM bpHOLD H
          INNER JOIN bpHOLD_REF HR ON H.HldCd = HR.HoldCode
          LEFT OUTER JOIN bpBASE_PERMIT B ON B.BaseId = H.BaseId
          LEFT OUTER JOIN bpMASTER_PERMIT M ON M.BaseId = H.BaseId
          WHERE 
            H.Deleted IS NULL 
            AND h.HldDate IS NULL
	          AND HR.Active = 1
	          AND	H.BASEID = (SELECT BASEID FROM PermitBASEIDs)
            AND (HR.SatFinalFlg = 1 or HR.SatNoInspection = 1 or AllowPreInspections = 1)";
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

    public static List<Hold> GetThisPermitsHolds(string permitNo)
    {
      string sql = @"
          USE WATSC;

          WITH PermitBASEIDs (BASEID) AS (
            SELECT TOP 1 BASEID FROM bpBASE_PERMIT
            WHERE BASEID IN 
              (SELECT DISTINCT BASEID FROM bpMASTER_PERMIT WHERE PERMITNO = @PermitNo
                UNION
                SELECT DISTINCT BASEID FROM bpASSOC_PERMIT WHERE PERMITNO = @PermitNo))

          SELECT 
	          H.PermitNo,
            H.BaseId,
 	          H.HldCd,
	          HR.HoldDesc,
	          HR.SatFinalFlg,
	          HR.SatNoInspection,
            HR.AllowPreInspections
          FROM bpHOLD H
          INNER JOIN bpHOLD_REF HR ON H.HldCd = HR.HoldCode
          LEFT OUTER JOIN bpBASE_PERMIT B ON B.BaseId = H.BaseId
          LEFT OUTER JOIN bpMASTER_PERMIT M ON M.BaseId = H.BaseId
          WHERE 
            H.Deleted IS NULL 
            AND h.HldDate IS NULL
	          AND HR.Active = 1
	          AND	H.BASEID = (SELECT BASEID FROM PermitBASEIDs)
            AND (HR.SatFinalFlg = 1 or HR.SatNoInspection = 1 or AllowPreInspections = 1)";
      try
      {
        using (IDbConnection db =
          new SqlConnection(Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"))))
        {
          var holds = db.Query<Hold>(sql, new { permitNo }).ToList();
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
