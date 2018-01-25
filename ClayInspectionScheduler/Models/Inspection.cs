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

    public string SetResult_URL { get; set; } = "";

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
          case "N":
            return "Not Performed";
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
        foreach (var l in li)
        {
          if (l.ResultDescription == "")
          {
            if (Constants.UseProduction() == true)
            {
              l.SetResult_URL = $@"http://claybccims/WATSWeb/Permit/Inspection/Inspection.aspx?InspReqId={l.InspReqID}&PermitNo={l.PermitNo}&OperId=&Type=Bldg&Desc={l.InsDesc}";
            }
            else
            {
              l.SetResult_URL = $@"http://claybccimstrn/WATSWeb/Permit/Inspection/Inspection.aspx?InspReqId={l.InspReqID}&PermitNo={l.PermitNo}&OperId=&Type=Bldg&Desc={l.InsDesc}";
            }
          }
        }
        return li;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        var li = new List<Inspection>();
        return li;
      }

    }


    public static bool UpdateInspectionResult(string PermitNo, string InspID, char Result, string Remark, string Username)
    {
      /**
       * 
       * Set inspection result
       * A simple Cancel should not do be done with the set result screen.
       *    That is easily done using the 'Cancel' button 
       *    on the View Inspection Screen. 
       * 
       * Only use the Set Result screen if a note needs to be added to a cancel.
       * 
       * I HAVE INQUIRED AS TO WHETHER THERE IS A DOCUMENT, PHYSICAL OR DIGITAL, 
       * REPRESENTING THE INSPECTION AND ALL MARKS FROM THE INSPECTOR THAT MAY
       * NEED TO BE VIEWED. NOT TRYING TO ADD ADDITIONAL FUNCTIONALITY BUT I WAS NOT SURE
       * IF THIS FUNCTIONALITY ALREADY EXISTS, WHICH WOULD NECESSITATE A LINK TO THE DOC
       * 
       * ALSO, WHEN THE INSPECTOR SAVES THE RESULT, WHERE WILL THE PROGRAM DIRECT THE USER?
       *  WILL IT LOAD INSPECTION SCHEDULER WITH THE PERMIT NUMBER FROM THE INSPECTION AND SHOW THE LIST OF INSPECTIONS?
       *  OR WILL IT DIRECT THE INSPECTOR BACK TO THE MAP/BULK LIST OF THEIR INSPECTIONS TO COMPLETE FOR THE DAY?
       *  
       * Options available on the Set Result screen:
       * FOR THOSE INSPECTED BY COUNTY INSPECTORS:
       *  APPROVE - Set ResultADC = 'A'
       *  DISSAPROVE - Set ResultADC = 'D'; ASSESS RE-INSPECTION FEE
       * 
       *  INSPECTION FEE IS FLAT $35.00 ASSESSED WHEN RESULT 'D' IS SELECTED AND SAVED
       *  CURRENTLY CALLING A STORED PROCEDURE TO ADD CHARGE ROW TO WATSC.dbo.ccCashierItem TABLE
       * 
       * FOR THOSE INSPECTED BY PRIVATE PROVIDERS
       *  PERFORMED -  SET ResultADC = 'P'
       *  NOT PERFORMED - SET ResultADC = 'N; NO RE-INSPECTION FEE ASSESSED  
       * 
       * REMARKS FIELD:
       *  FIELD AND FUNCTIONALITY WILL REMAIN THE SAME AS OLD IMS VERSION. 
       *  RESULT IS NECESSARY TO SAVE
       *  REMARKS BY INSPECTOR ARE NOT REQUIRED TO SAVE
       *    (CHECK WITH BLDG DEPT IF REMARK SHOULD BE REQ. IF RESULT IS 'D' OR 'N')
       *  
       * COMMENTS: 
       *  1. ONLY VISIBLE IF INTERNAL
       *  2. PREVIOUS COMMENTS CANNOT BE DELETED
       *  3. NEW COMMENTS APPENDED TO FIELD
       *    a. INCLUDE TIMESTAMP
       *    b. INCLUDE USERNAME IF INTERNAL / INITIAL IF EXTERNAL
       *    
       * ADDITIONAL FUNCTIONS:
       *  1. CREATE HOLD (STORED PROCEDURE: WATSC.dbo.prc_upd_ir)
       *      @HoldId = SELECT HoldId FROM bpHOLD WHERE HOLD_InspReqId = INSP_InspReqId
       *      IF @HoldId IS NULL
       *        INSERT INTO bpHOLD
			 *         (BaseID, PermitNo, HldCd, InspReqID, InspReqChrg, HldInput)
       *         SET @HoldId = SCOPE_IDENTITY();
       *      IF HoldId IS NOT NULL
       *       UPDATE bpHOLD
			 *       SET  InspReqID = @InspReqID, InspReqChrg = @Amt, HldInput = @HldInput+@Amt
			 *       WHERE HoldID = @HoldId
       *  2. CREATE CHARGE
       *       @HldInput = PermitNo + ' ' + 
       *                  InspectionCode + ' ' + 
       *                  cast(MONTH(SchecDateTime) as varchar(2)) + '/' + 
       *                  cast(DAY(SchecDateTime) as varchar(2))+ '/' + 
       *                  cast(Year(SchecDateTime) as varchar(4)) + ' $',
			 *                  @PermitNo=PermitNo
       *       INSERT INTO ccCashierItem (NTUser, CatCode, Assoc, AssocKey, BaseFee, Total, Variable, Narrative, HoldID)
       *       VALUES (@UserName,@CatCd,@AlphaPermitType,@PermitNo,@Amt,@Amt,1,@HldInput, @HoldId)
       *       
      **/

      return false;
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

          return Constants.Exec_Query(sql, dbArgs) > 0;

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