using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Hold
  {
    private string PermitNo { get; set; }
    private string HldCd { get; set; }
    private string HoldDesc { get; set; }
    private int SatFinalFlag { get; set; }
    private int SatNoInspection { get; set; }

    public Hold()
    {

    }

    public List<string> GetHolds(string PermitNo)
    {

      var dbArgs = new DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      string sql = @"
          USE WATSC;

          SELECT 
	          H.PermitNo,
 	          H.HldCd,
	          HR.HoldDesc,
	          HR.SatFinalFlg,
	          HR.SatNoInspection
          FROM bpHOLD H
          INNER JOIN bpHOLD_REF HR
	          ON H.HldCd = HR.HoldCode
          WHERE H.Deleted IS NULL 
	          AND HR.Active = 1
	          AND	H.PermitNo = @PermitNo
          
          ";

      try
      {
        return Constants.Get_Data<string>(sql, dbArgs);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }
    }
  }
}
