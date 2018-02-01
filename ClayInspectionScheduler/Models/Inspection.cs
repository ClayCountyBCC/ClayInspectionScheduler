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
    private string PermitTypeString
    {
      get
      {
        return GetPermitType(PermitNo);
      }
    }
    private static string GetPermitType(string PermitNumber)
    {
      switch (PermitNumber[0].ToString())
      {
        case "2":
          return "EL";
        case "3":
          return "PL";
        case "4":
          return "ME";
        case "6":
          return "FR";
        default:
          return "BL";
      }
    }

    public string InspReqID { get; set; }

    public string InspectionCode { get; set; }

    public string InsDesc { get; set; }

    public DateTime InspDateTime { get; set; } = DateTime.MinValue;

    public string ResultADC { get; set; } = "";

    public string SetResult_URL { get; set; } = "";

    public int PrivateProviderInspectionRequestId { get; set; } = 0;

    public string ResultDescription
    {
      get
      {
        return GetResultDescription(ResultADC);
      }
    }
       
    private static string GetResultDescription(string ResultCode)
    {
      switch (ResultCode)
      {
        case "A":
          return "Approved";
        case "C":
          return "Canceled";
        case "D":
          return "Denied";
        case "P":
          return "Performed";
        case "N":
          return "Not Performed";
        case "":
          return "Incomplete";
        default:
          return "";

      }
    }
    public string Remarks { get; set; } = null;

    public string Comments { get; set; } = "";

    public DateTime SchedDateTime { get; set; }

    public string Phone { get; set; } = "";

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

    public List<string> Errors { get; set; } = new List<string>();

    public Inspection()
    {


    }

    private static List<Inspection> GetRaw(int InspectionId)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@InspectionId", InspectionId);

      string sql = @"
        USE WATSC;

        SELECT
          i.InspReqID,
          i.PermitNo, 
          ISNULL(i.InspectionCode, '') InspectionCode, 
          ISNULL(ir.InsDesc, 'No Inspections') InsDesc, 
          i.InspDateTime, 
          LTRIM(RTRIM(ISNULL(i.ResultADC, ''))) ResultADC,
          i.SchecDateTime SchedDateTime,
	        i.Poster,
          i.Remarks,
          i.Comment,
          ip.name as InspectorName,
          PrivProvIRId PrivateProviderInspectionRequestId
        FROM bpINS_REQUEST i 
        LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
        LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
        WHERE I.InspReqID = @InspectionId
        ORDER BY InspReqID DESC";
      return Constants.Get_Data<Inspection>(sql, dbArgs);
    }

    private static List<Inspection> GetRaw(string PermitNumber)
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", PermitNumber);

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
            LTRIM(RTRIM(ISNULL(i.ResultADC, ''))) ResultADC,
            i.SchecDateTime SchedDateTime,
	          i.Poster,
            i.Remarks,
            i.Comment,
            ip.name as InspectorName,
            PrivProvIRId PrivateProviderInspectionRequestId
        FROM Permits P
        LEFT OUTER JOIN bpINS_REQUEST i ON P.PermitNo = i.PermitNo
        LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
        LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
        ORDER BY InspReqID DESC";
      return Constants.Get_Data<Inspection>(sql, dbArgs);
    }

    public static Inspection Get(int InspectionId)
    {
      var t = GetRaw(InspectionId);
      if(t.Count() == 1)
      {
        return t.First();
      }
      else
      {
        return null;
      }
    }

    public static List<Inspection> Get(string PermitNumber)
    {
      var li = GetRaw(PermitNumber);
      if (li == null)
      {
        return new List<Inspection>();
      }
      else
      {
        return li;
      }
    }


    public static bool AddComment(
      int InspectionId, 
      string Comment, 
      UserAccess ua)
    {
      if(ua.current_access == UserAccess.access_type.public_access | 
        ua.current_access == UserAccess.access_type.no_access)
      {
        return false;
      }
      else
      {
        string sp = "add_inspection_comment";
        var dp = new DynamicParameters();
        dp.Add("@Username", ua.display_name);
        dp.Add("@InspectionId", InspectionId);
        dp.Add("@FirstComment", Comment);
        int i = Constants.Exec_Query_SP(sp, dp);
        return i > 0;
      }
    }


    public static Inspection UpdateInspectionResult(
      string PermitNumber, 
      int InspectionId, 
      string ResultCode, 
      string Remarks, 
      string Comments,
      UserAccess User)
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

      var current = Get(InspectionId);
      if(current == null)
      {
        return null;
      }
      if (current.Validate(PermitNumber, ResultCode, User))
      {
        // let's do some saving
        switch (ResultCode)
        {
          case "A":
          case "P":
          case "N":
          case "C":
            if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User))
            {
              current.Errors.Add("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
            }
            return current;
          case "D":
            string HoldInput = current.PermitNo + " " + current.InspectionCode + " $35";
            if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User, PermitNumber, HoldInput))
            {
              current.Errors.Add("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
            }
            else
            {
              // now add the hold and fees
            }
            return current;
        }
      }
      return current;
    }

    private static bool UpdateStatus(int InspectionId,
      string ResultCode,
      string OldResult,
      string Remarks,
      string Comments,
      int PrivateProviderInspectionId,
      UserAccess User,
      string PermitNumber = "",
      string HoldInput = "")
    {
      var dp = new DynamicParameters();
      dp.Add("@InspectionId", InspectionId);
      dp.Add("@Remarks", Remarks);
      dp.Add("@ResultCode", ResultCode);
      dp.Add("@Poster", User.user_name);
      dp.Add("@User", User.display_name);
      if(ResultCode != OldResult)
      {
        dp.Add("@FirstComment", $"Status changed from {GetResultDescription(OldResult)} to {GetResultDescription(ResultCode)}.");
        dp.Add("@SecondComment", Comments);
      }
      else
      {
        dp.Add("@FirstComment", Comments);
        dp.Add("@SecondComment", "");
      }

      

      string sql = @"
        USE WATSC;
        UPDATE bpINS_Request
        SET 
          ResultADC = @ResultCode,
          InspDateTime = GETDATE(),
          Remarks = @Remarks,
          Poster = @Poster,
          ChrgCode = @ChargeCode
        WHERE
          InspReqId=@InspectionId;

        EXEC add_inspection_comment @User, @InspectionId, @FirstComment, @SecondComment;";

      if (PrivateProviderInspectionId > 0)
      {
        sql += GetPrivateProviderQuery();
        dp.Add("@PrivateProviderInspectionId", PrivateProviderInspectionId);
      }

      if (ResultCode == "D")
      {
        dp.Add("@ChargeCode", "T");
        sql += GetDenialQueries();
        dp.Add("@Amount", 35);
        dp.Add("@HoldInput", HoldInput);
        dp.Add("@PermitNumber", PermitNumber);
        dp.Add("@PermitType", GetPermitType(PermitNumber));
      }
      else
      {
        dp.Add("@ChargeCode", null);
      }



      int i = Constants.Exec_Query(sql, dp);
      return i > 0;

    }

    private bool Validate(string PermitNumber, string ResultCode, UserAccess User)
    {
      if(PermitNumber != PermitNo)
      {
        Errors.Add("The permit number does not match the inspection, please check your request and try again.");
        return false;
      }
      switch (ResultCode.Trim())
      {
        case "A":
        case "": // result is not set
        case "D":
        case "P":
        case "N":
          // only inspectors can change the result
          if (User.current_access == UserAccess.access_type.inspector_access)
          {
            Errors.Add("Unauthorized Access.");
            return false;
          }
          // If they are trying to change something that was completed before today.
          if (InspDateTime != DateTime.MinValue && InspDateTime.Date < DateTime.Today.Date)
          {
            Errors.Add("Inspections completed prior to Today's date cannot be changed.");
            return false;
          }
          if(ResultCode == "D" & Remarks.Length == 0)
          {
            Errors.Add("Disapprovals must have remarks included in order to be saved.");
            return false;
          }
          return true;

        case "C":
          if (User.current_access == UserAccess.access_type.public_access |
            User.current_access == UserAccess.access_type.basic_access |
            User.current_access == UserAccess.access_type.inspector_access)
          {
            if(ResultADC.Length != 0)
            {
              Errors.Add("Cannot cancel a completed inspection.  This inspection was completed on: " + InspDateTime.ToShortDateString());
              return false;
            }
            if(Remarks.Trim().Length == 0 && User.current_access != UserAccess.access_type.public_access)
            {
              Errors.Add("You must include a reason why this inspection is being cancelled in the Remarks field.");
              return false;
            }
            return true;
          }
          else
          {
            Errors.Add("Unauthorized Access.");
            return false;
          }
        default:
          Errors.Add("Unauthorized Access.");
          return false;          
      }
    }

    private static string GetPrivateProviderQuery()
    {
      string sql = @"
        UPDATE bpPrivateProviderInsp
        SET 
          Result = @ResultCode, 
          InspDt = GetDate()
        WHERE 
          IRId = @PrivateProviderInspectionId
          AND ResultADC IS NULL;";
      return sql;
    }

    private static string GetDenialQueries()
    {
      string sql = @"
		DECLARE @HoldId int;
		SELECT 
      @HoldId = HoldId 
    FROM dbo.bpHOLD 
    WHERE 
      InspReqID = @InspectionId 
      AND HldCd = '1REI';

		IF @HoldId IS NULL
		  BEGIN
			  INSERT INTO bpHOLD
				  (BaseID, PermitNo, HldCd, InspReqID, InspReqChrg, HldInput)
        SELECT
          BaseId, 
          PermitNo, 
          '1REI', 
          @InspectionId, 
          @Amount, 
          @HoldInput
        FROM dbo.bpINS_REQUEST 
        WHERE 
          InspReqID = @InspReqID;

        SET @HoldId = SCOPE_IDENTITY();
		  END

		ELSE

		  BEGIN
  	    UPDATE bpHOLD
			  SET
          InspReqID = @InspectionId, 
          InspReqChrg = @Amount, 
          HldInput = @HldInput + @Amt
			  WHERE 
          HoldID = @HoldId 
		  END
	  END
		INSERT INTO ccCashierItem (NTUser, CatCode, Assoc, AssocKey, BaseFee, Total, Variable, Narrative, HoldID) 
    VALUES (@Poster,'REI',@PermitType,@PermitNumber,@Amount,@Amount,1, @HoldInput, @HoldId)";
      return sql;
    }

  }
}