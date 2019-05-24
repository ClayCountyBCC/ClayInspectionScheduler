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

    public bool IsCommercial { get; set; }

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

    public int InspReqID { get; set; } = 0;

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
          return "Disapproved";
        case "P":
          return "Performed";
        case "N":
          return "Not Performed";
        case "":
          return "Scheduled";
        default:
          return "";

      }
    }

    public string Remarks { get; set; } = null;

    public string Comment { get; set; } = "";

    public DateTime SchedDateTime { get; set; }

    public string Phone { get; set; } = "";

    public string InspectorName { get; set; } = "Unassigned";

    public string DisplayInspDateTime
    {
      get
      {
        if (this.ResultADC == "C")
          return (InspDateTime == DateTime.MinValue) ? "N/A" : InspDateTime.ToString("MM/dd/yyyy");

        return (InspDateTime == DateTime.MinValue) ? "Scheduled" : InspDateTime.ToString("MM/dd/yyyy");

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
    public string UpdateError { get; set; } = "";
    public string GeoZone { get; set; } = "";
    public string FloodZone { get; set; } = "";
    public string StreetAddress { get; set; } = "";
    public string InspectorColor { get; set; } = "";
    public string Day { get; set; } = "";
    public Inspection()
    {

    }

    public static List<Inspection> GetInspectionList()
    {
      var il = GetRawInspectionList();
      return il;
    }

    private static List<Inspection> GetRawInspectionList()
    {
      var dc = DateCache.getDateCache(false, DateTime.MinValue, false );

      var dp = new DynamicParameters();
      var tomorrow = (from g in dc.goodDates where g > DateTime.Today.Date orderby g select g).First();

      dp.Add("@Today", DateTime.Today.Date);
      dp.Add("@Tomorrow", tomorrow.Date);

      string sql = @"
        USE WATSC;

        EXEC prc_sel_InspSched_inspection_list @Today, @Tomorrow
        
      ";


      Constants.Get_Data<Inspection>(sql, dp);
      try
      {
        var il = Constants.Get_Data<Inspection>(sql, dp);
        return il;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Inspection>();
      }

    }

    private static List<Inspection> GetRaw(int InspectionId = 0, string PermitNumber = "")
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@InspectionId", InspectionId);
      dbArgs.Add("@PermitNo", PermitNumber);
      string sql = @"
        USE WATSC;
        
        EXEC prc_sel_InspSched_get_raw_inspections @PermitNo, @InspectionId;
          
      ";

      var inspections = Constants.Get_Data<Inspection>(sql, dbArgs);

      return inspections;
    }

    //private static List<Inspection> GetRaw(string PermitNumber)
    //{
    //  var dbArgs = new Dapper.DynamicParameters();
    //  dbArgs.Add("@PermitNo", PermitNumber);

    //  string sql = @"
    //    USE WATSC;
    //    DECLARE @MPermitNo CHAR(8) = (SELECT MPermitNo FROM bpASSOC_PERMIT WHERE PermitNo = @PermitNo);

    //    DECLARE @Today DATE = Cast(GetDate() as DATE);

    //    WITH Permits(PermitNo) AS (
    //      SELECT M.PermitNo
    //      FROM bpMASTER_PERMIT M
	   //     WHERE 
    //        M.VoidDate IS NULL AND
    //        (M.PermitNo = @MPermitNo 
		  //      OR M.PermitNo = @PermitNo)
    //      UNION ALL
    //      SELECT A.PermitNo
    //      FROM 
    //        bpASSOC_PERMIT A
    //      WHERE
    //        A.VoidDate IS NULL AND
    //        (A.PermitNo = @PermitNo 
		  //      OR MPermitNo = @MPermitNo
		  //      OR A.mPermitNo = @PermitNo)
    //    )

    //    SELECT 
    //      ISNULL(i.InspReqID, 0) InspReqID,
    //      P.PermitNo, 
    //      ISNULL(i.InspectionCode, '') InspectionCode, 
    //      ISNULL(ir.InsDesc, 'No Inspections') InsDesc, 
    //      i.InspDateTime, 
    //      LTRIM(RTRIM(ISNULL(i.ResultADC, ''))) ResultADC,
    //      i.SchecDateTime SchedDateTime,
	   //     i.Poster,
    //      ISNULL(IP.Color, '#FFFFFF') InspectorColor,
    //      i.Remarks,
    //      i.Comment,
    //      ip.name as InspectorName,
    //      PrivProvIRId PrivateProviderInspectionRequestId
    //    FROM Permits P
    //    LEFT OUTER JOIN bpINS_REQUEST i ON P.PermitNo = i.PermitNo 
    //    LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
    //    LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
    //    ORDER BY CASE WHEN ISNULL(LTRIM(RTRIM(ResultADC)), '') = '' THEN 1 ELSE 0 END DESC, 
    //      ISNULL(InspDateTime, GETDATE()) DESC, InspReqID ASC";
    //  return Constants.Get_Data<Inspection>(sql, dbArgs);
    //}

    public static Inspection Get(int InspectionId, string permitNumber = "")
    {
      var t = GetRaw(InspectionId,permitNumber);
      if (t.Count() == 1)
      {
        return t.First();
      }
      else
      {
        return null;
      }
    }

    public static List<Inspection> Get(string PermitNumber, int inspectionId = 0)
    {
      var li = GetRaw(inspectionId, PermitNumber);
      if (li == null)
      {
        return new List<Inspection>();
      }
      else
      {
        return li;
      }
    }

    public static Inspection AddComment(
      int InspectionId,
      string Comment,
      UserAccess ua)
    {
      Comment = Comment.Trim();
      if (ua.current_access == UserAccess.access_type.public_access)
      {
        return null;
      }
      else
      {
        string sp = "dbo.add_inspection_comment";
        var dp = new DynamicParameters();
        dp.Add("@Username", ua.display_name);
        dp.Add("@InspectionId", InspectionId);
        dp.Add("@FirstComment", Comment);
        int i;
        try // This function is for stored procedures
        {
          string cs = Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"));
          using (IDbConnection db = new SqlConnection(cs))
          {
            i = db.Execute(sp, dp, commandType: CommandType.StoredProcedure);
          }
        }
        catch (Exception ex)
        {
          Constants.Log(ex, "");
          i = 0;
        }
        //int i = Constants.Exec_Query_SP(sp, dp);
        if (i == -1)
        {
          Inspection isnp = Get(InspectionId);
          return isnp;
        }
        else
        {
          return null;
        }
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
      PermitNumber = PermitNumber.Trim();
      ResultCode = ResultCode.Trim();
      Remarks = Remarks.Trim();
      Comments = Comments.Trim();
      try
      {
        Inspection current = Get(InspectionId);
        if (current == null)
        {
          return null;
        }

        if (current.Validate(PermitNumber, current, ResultCode, Remarks, User))
        {
          // let's do some saving
          switch (ResultCode)
          {
            case "A":
            case "P":
            case "N":
            case "C":
            case "":
              if(current.ResultADC == "D")
              {
                if(IsREIPaid(current.InspReqID))
                {
                  current.UpdateError = ("The REI has already been paid, you cannot change the result of this inspection.");
                  break;
                }
              }

              if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User))
              {
                current.UpdateError = ("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
              }
              break;

            case "D":
              string HoldInput = current.PermitNo + " " + current.InspectionCode + " $35";
              if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User, PermitNumber, HoldInput))
              {
                current.UpdateError = ("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
              }
              break;
          }
        }

        Inspection i = Get(InspectionId);
        return i;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, "");
        return null;
      }
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
      if (ResultCode != OldResult)
      {
        dp.Add("@FirstComment", $"Status changed from {GetResultDescription(OldResult)} to {GetResultDescription(ResultCode)}.");
        dp.Add("@SecondComment", Comments);
      }
      else
      {
        dp.Add("@FirstComment", Comments);
        dp.Add("@SecondComment", "");
      }

      string sql = $@"
        USE WATSC;

        UPDATE bpINS_Request
        SET 
          ResultADC = CASE WHEN @ResultCode = '' THEN NULL
                           WHEN @ResultCode IN ('A','D','P','N','C') THEN @ResultCode END,
          InspDateTime = CASE WHEN @ResultCode = '' THEN NULL
                              WHEN @ResultCode IN ('A','D','P','N','C') THEN GETDATE() END,
          Remarks = @Remarks,
          Poster = @Poster,
          ChrgCode = @ChargeCode
        WHERE
          InspReqId=@InspectionId
          
          EXEC add_inspection_comment @User, @InspectionId, @FirstComment, @SecondComment
          
      ";

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
        sql += GetNotDeniedQueries();
        dp.Add("@ChargeCode", null);
      }
      int i = Constants.Exec_Query(sql, dp);
      return i > 0;

    }

    private bool Validate(string PermitNumber, Inspection currentInspection, string ResultCode, string UserRemarks, UserAccess User)
    {
      if (User.current_access == UserAccess.access_type.contract_access)
      {
        List<Inspector> inspList = Inspector.GetCached();

        var inspectors = (from i in inspList
                          where i.NTUsername == User.user_name
                          select i).ToList();
        if (inspectors.Count() == 0)
        {
          Errors.Add("Inspector not found.");
        }
        if (inspectors.First().Name != currentInspection.InspectorName)
        {
          Errors.Add("This inspection is not assigned to this inspector.");
        }
      }
      if (PermitNumber != PermitNo)
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
          if (User.current_access == UserAccess.access_type.public_access)
          {
            Errors.Add("Unauthorized Access.");
            return false;
          }

          if (ResultCode == "A" || ResultCode == "D")
          {
            if (PrivateProviderInspectionRequestId > 0)
            {
              Errors.Add("Private provider inspections must be marked as Not Performed or Performed.");
              return false;
            }
          }

          // If they are trying to change something that was completed before today.
          if (currentInspection.ResultADC != "" &&
              InspDateTime != DateTime.MinValue.Date &&
              InspDateTime.Date < DateTime.Today.AddDays(-2).Date)
          {
            Errors.Add("Inspections completed more than two days ago cannot be changed.");
            return false;
          }
          if (currentInspection.ResultADC != "" &&
              InspDateTime != DateTime.MinValue.Date &&
              User.current_access == UserAccess.access_type.contract_access)
          {
            Errors.Add("Completed inspections cannot be changed. Please contact the Building departent for assistance.");
            return false;
          }
          if (ResultCode == "D" & UserRemarks.Length == 0)
          {
            Errors.Add("Disapprovals must have remarks included in order to be saved.");
            return false;
          }
          return true;

        case "C":
          if (User.current_access == UserAccess.access_type.public_access ||
            User.current_access == UserAccess.access_type.basic_access ||
            User.current_access == UserAccess.access_type.inspector_access ||
            User.current_access == UserAccess.access_type.contract_access)
          {
            if (ResultADC.Length != 0 && InspDateTime.ToLocalTime() < DateTime.Today.AddDays(-2))
            {
              Errors.Add("Cannot cancel a completed inspection.  This inspection was completed on: " + InspDateTime.ToShortDateString());
              return false;
            }
            if (UserRemarks.Trim().Length == 0 && User.current_access != UserAccess.access_type.public_access)
            {
              Errors.Add("You must include a reason why this inspection is being canceled in the Remarks field.");
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
          AND Result IS NULL;";
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
              InspReqID = @InspectionId;

            SET @HoldId = SCOPE_IDENTITY();
		      END

		    ELSE

		      BEGIN
  	        UPDATE bpHOLD
			      SET
              InspReqID = @InspectionId, 
              InspReqChrg = @Amount, 
              HldInput = @HoldInput
			      WHERE 
              HoldID = @HoldId;

            -- If we are updating the hold, there is probably an existing charge that will need to be removed
            -- This happens if someone updates an item that was disapproved (ie: the hold and charge were already added)
            -- We will insert the new charge after this section is done.

            DELETE 
            FROM ccCashierItem 
            WHERE 
            Narrative = @HoldInput
            AND HoldID = @HoldId
            AND CashierId IS NULL;

		      END
		    
        INSERT INTO ccCashierItem (NTUser, CatCode, Assoc, AssocKey, BaseFee, Total, Variable, Narrative, HoldID) 
        VALUES (@Poster,'REI',@PermitType,@PermitNumber,@Amount,@Amount,1, @HoldInput, @HoldId)";
      return sql;
    }

    private static string GetNotDeniedQueries()
    {
      return @"

        DELETE C
        FROM ccCashierItem C
        INNER JOIN bpHold B ON C.HoldId = B.HoldID
        WHERE B.InspReqID = @InspectionId
          AND C.CashierId IS NULL;

        DELETE H
        FROM bpHold H
        INNER JOIN ccCashierItem C ON C.HoldID = H.HoldID
        WHERE InspReqID = @InspectionId 
          AND C.CashierId IS NULL;
";
    }

    public static bool PassedElectricalEquipmentCheck(string permitNumber)
    {
      var l = new List<int>();
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", permitNumber);

      string sql = @"
        USE WATSC;
        
        SELECT 
          InspReqID
        FROM bpINS_REQUEST IR
        WHERE PermitNo = @PermitNo
          AND InspectionCode = '205'
  ";
      l.AddRange(Constants.Get_Data<int>(sql, dbArgs));
      return l.Count() > 0;
    }

    public static bool IsREIPaid(int InspectionId)
    {
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@InspectionId", InspectionId);

      string sql = @"
        USE WATSC;
        SELECT itemId
        FROM ccCashierItem CI
          INNER JOIN bpHOLD H ON H.HoldID = CI.HoldID
          INNER JOIN bpINS_REQUEST IR ON H.InspReqID = IR.InspReqID      
        WHERE
          IR.InspReqId=@InspectionId
          AND CI.CashierId IS NOT NULL";

      return Constants.Get_Data<string>(sql, dbArgs).Count() > 0;

    }
  }
}