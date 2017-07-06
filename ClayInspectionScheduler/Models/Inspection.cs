using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using Dapper;

namespace ClayInspectionScheduler.Models
{
  public class Inspection
  {
    public string PermitNo { get; set; }

    public string InspReqID { get; set; }

    public string InspectionCode { get; set; }

    public string InsDesc { get; set; }

    public DateTime InspDateTime { get; set; } = DateTime.MinValue;

    public string ResultADC { get; set; }

    public string ResultDescription
    {
      get
      {
        switch (ResultADC)
        {
          case "A":
            return "Approved";
          case "C":
            return "Canceled";
          case "D":
            return "Denied";
          case "P":
            return "Pass";
          default:
            return "";

        }
      }
    }

    public string Remarks { get; set; } = null;

    public DateTime SchedDateTime { get; set; }

    public string Phone { get; set; } = " ";

    public string InspectorName { get; set; } = "Unassigned";


    public string DisplayInspDateTime
    {
      get
      {
        if (this.ResultADC == "C")
          return (InspDateTime == DateTime.MinValue) ? "N/A" : InspDateTime.ToString("MM/dd/yyyy");

        return (InspDateTime == DateTime.MinValue) ? "Not Completed" : InspDateTime.ToString("MM/dd/yyyy");

      }

    }

    public string DisplaySchedDateTime
    {
      get
      {
        return SchedDateTime == DateTime.MinValue ? "" : SchedDateTime.ToString("MM/dd/yyyy");
      }
    }

    public Inspection()
    {


    }

    public static List<Inspection> Get(string key)
    {

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", key);



      string sql = @"
        
        USE WATSC;
        DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

        DECLARE @Today DATE = Cast(GetDate() as DATE);
        select 
          i.InspReqID,
          i.PermitNo, 
          i.InspectionCode, 
          ir.InsDesc, 
          i.InspDateTime, 
          i.ResultADC,
          i.SchecDateTime SchedDateTime,
          i.Remarks,
          CASE WHEN CAST(i.SchecDateTime AS DATE) >= @Today AND ResultADC IS NULL
          THEN LTRIM(RTRIM(ip.name)) 
          ELSE '' END AS InspectorName,
          CASE WHEN CAST(i.SchecDateTime AS DATE) >= @Today AND ResultADC IS NULL
          THEN LTRIM(RTRIM(ip.PhoneNbr)) 
          ELSE '' END AS PhoneNumber,
          ir.partial
        from bpINS_REQUEST i
              LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
              LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
        where baseID = (select distinct a.BaseID 
                        from bpASSOC_PERMIT a 
                        where a.permitno = @PermitNo 
                           or a.MPermitNo = @PermitNo 
                        union select m.BaseID 
                        from bpMASTER_PERMIT m 
                        where m.permitno = @PermitNo 
                           or m.PermitNo = @MPermitNo)
		    order by InspReqID DESC";
      try
      {
        var li = Constants.Get_Data<Inspection>(sql, dbArgs);
        return li;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        var li = new List<Inspection>();
        li.Clear();
        return li;
      }

    }


    public static bool Cancel(string PermitNo, string InspID)
    {
      if (PermitNo != null && InspID != null)
      {


        var dbArgs = new Dapper.DynamicParameters();
        dbArgs.Add("@PermitNo", PermitNo);
        dbArgs.Add("@ID", InspID);


        string sql = @"

          USE WATSC;
        
          Update bpINS_REQUEST
          set RESULTADC = 'C'
          where PermitNo = @PermitNo AND InspReqID = @ID
            
          update bpPrivateProviderInsp
          SET Result = 'C'
          WHERE IRId = (SELECT PrivProvIRId FROM bpINS_REQUEST WHERE InspReqID = @ID);";

        try
        {

          return Constants.Execute(sql, dbArgs) > 0;

        }
        catch (Exception ex)
        {
          Constants.Log(ex, sql);
          return false;
        }
      }
      else
        return false;
    }

  }
}