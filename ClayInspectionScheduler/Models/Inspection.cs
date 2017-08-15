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

        return (InspDateTime == DateTime.MinValue) ? "incomplete" : InspDateTime.ToString("MM/dd/yyyy");

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

        WITH Permits(PermitNo) AS (
          SELECT M.PermitNo
          FROM bpMASTER_PERMIT M
	        WHERE 
            M.VoidDate IS NULL AND
            (M.PermitNo = @MPermitNo 
		        OR M.PermitNo = @PermitNo)
          UNION ALL
          SELECT A.PermitNo
          FROM 
            bpASSOC_PERMIT A
          WHERE
            A.VoidDate IS NULL AND
            (A.PermitNo = @PermitNo 
		        OR MPermitNo = @MPermitNo
		        OR A.mPermitNo = @PermitNo)
        )

        select 
            ISNULL(i.InspReqID, 99999999) InspReqID,
            P.PermitNo, 
            ISNULL(i.InspectionCode, '') InspectionCode, 
            ISNULL(ir.InsDesc, 'No Inspections') InsDesc, 
            i.InspDateTime, 
            i.ResultADC,
            i.SchecDateTime SchedDateTime,
	        i.Poster,
            i.Remarks,
            ip.name as InspectorName
        FROM Permits P
        LEFT OUTER JOIN bpINS_REQUEST i ON P.PermitNo = i.PermitNo
        LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
        LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
        ORDER BY InspReqID DESC";


      try
      {
        var li = Constants.Get_Data<Inspection>(sql, dbArgs);
        return li;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        var li = new List<Inspection>();
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
          set RESULTADC = 'C', InspDateTime = GetDate()
          where PermitNo = @PermitNo AND InspReqID = @ID
            
          update bpPrivateProviderInsp
          SET Result = 'C', InspDt = GetDate()
          WHERE IRId = (SELECT PrivProvIRId FROM bpINS_REQUEST WHERE InspReqID = @ID);";

        try
        {

          return Constants.Get_Data(sql, dbArgs) > 0;

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