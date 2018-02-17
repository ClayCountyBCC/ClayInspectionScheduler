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
          return "Incomplete";
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

    public string GeoZone { get; set; } = "";
    public string FloodZone { get; set; } = "";
    public string StreetAddress { get; set; } = "";
    public string InspectorColor { get; set; } = "";
    public string Day { get; set; } = "";
    //{
    //  get
    //  {
    //    if (SchedDateTime == DateTime.MinValue) return "";
    //    if (SchedDateTime.Date == DateTime.Today.Date)
    //    {
    //      return "Today";
    //    }
    //    else if (SchedDateTime.Date == DateTime.Today.AddDays(1).Date)
    //    {
    //      return "Tomorrow";
    //    }
    //    else if(SchedDateTime.Date > DateTime.Today.AddDays(1).Date)
    //    {
    //      return "Later";
    //    }

    //    return "";
    //  }
    //}

    public Inspection()
    {

    }

    public static List<Inspection> GetInspectorList()
    {
      var il = GetRawInspectionList();
      return il;
    }

    private static List<Inspection> GetRawInspectionList()
    {
      var dc = DateCache.getDateCache(false, DateTime.MinValue);

      var dp = new DynamicParameters();
      var tomorrow = (from g in dc.goodDates where g > DateTime.Today.Date orderby g select g).First();

      dp.Add("@Today", DateTime.Today.Date);
      dp.Add("@Tomorrow", tomorrow.Date);

      Console.Write(dp);

      //DECLARE @Today DATE = CAST(GETDATE() AS DATE);
      //DECLARE @Tomorrow DATE =
      //  CASE DATEPART(DW, @Today)
      //    WHEN 1-- if today is Friday, Saturday, or Sunday
      //      THEN CAST(DATEADD(DAY, 1, @Today) AS DATE) --set it to Monday
      //   WHEN 6
      //      THEN CAST(DATEADD(DAY, 3, @Today) AS DATE) --set it to Monday
      //   WHEN 7
      //      THEN CAST(DATEADD(DAY, 2, @Today) AS DATE) --set it to Monday
      //  ELSE CAST(DATEADD(DAY, 1, @Today) AS DATE)-- Set it to tomorrow
      //    END;


      string sql = @"
          USE WATSC;

        WITH BaseFloodZone AS (
          SELECT DISTINCT
            LTRIM(RTRIM(FloodZone)) FloodZone,
            F.BaseID
          FROM bpFLOOD_ZONE F
          INNER JOIN bpINS_REQUEST I ON F.BaseID = I.BaseId
          WHERE 
            LEN(LTRIM(RTRIM(F.FloodZone))) > 0 
            AND (CAST(I.SchecDateTime AS DATE) IN (CAST(@Today AS DATE), CAST(@Tomorrow AS DATE))
            OR (CAST(SchecDateTime AS DATE) < CAST(@Today AS DATE)
              AND ResultADC IS NULL))
        ), FloodZoneData AS (
          SELECT 
            F.BaseID,
            STUFF((
              SELECT ', ' + FloodZone
              FROM BaseFloodZone B
              WHERE F.BaseID = B.BaseId
              FOR XML PATH (''), TYPE)
              .value('(./text())[1]','nvarchar(max)')
              , 
              1, 
              2, 
              N'') AS FloodZone
          FROM BaseFloodZone F
          GROUP BY F.BaseId
        )

        SELECT
          B.ProjAddrCombined StreetAddress,
          I.InspReqID,
          I.PermitNo, 
          ISNULL(I.InspectionCode, '') InspectionCode, 
          ISNULL(IR.InsDesc, 'No Inspections') InsDesc, 
          I.InspDateTime, 
          LTRIM(RTRIM(ISNULL(i.ResultADC, ''))) ResultADC,
          I.SchecDateTime SchedDateTime,
	        I.Poster,
          ISNULL(IP.Color, '#FFFFFF') InspectorColor,
          I.Remarks,
          I.Comment,
          CASE WHEN CAST(I.SchecDateTime AS DATE) < @Today THEN ''
               WHEN CAST(I.SchecDateTime AS DATE) = @Today THEN 'Today'
               WHEN CAST(I.SchecDateTime AS DATE) = @Tomorrow THEN 'Tomorrow' 
               WHEN CAST(I.SchecDateTime AS DATE) > @Tomorrow THEN 'Later'  END [Day],
          LTRIM(RTRIM(IP.name)) as InspectorName,
          PrivProvIRId PrivateProviderInspectionRequestId,
          ISNULL(LTRIM(RTRIM(B.GeoZone)), '') GeoZone,
          ISNULL(F.FloodZone, '') FloodZone
        FROM bpINS_REQUEST I 
        LEFT OUTER JOIN bpBASE_PERMIT B ON I.BaseId = B.BaseID
        LEFT OUTER JOIN bpINS_REF IR ON IR.InspCd = I.InspectionCode
        LEFT OUTER JOIN bp_INSPECTORS IP ON I.Inspector = IP.Intl 
        LEFT OUTER JOIN FloodZoneData F ON I.BaseId = F.BaseID
        WHERE 
        -- Here we want to see the inspections that were scheduled for today and tomorrow
          (CAST(SchecDateTime AS DATE) IN (CAST(@Today AS DATE), CAST(@Tomorrow AS DATE))
        -- and we want to include any from the past that aren't completed.
          OR (CAST(SchecDateTime AS DATE) < CAST(@Today AS DATE)
            AND ResultADC IS NULL))
        ORDER BY InspReqID DESC";


       Constants.Get_Data<Inspection>(sql, dp);
      try
      {
        var il = Constants.Get_Data<Inspection>(sql, dp);
        return il;
      }
      catch(Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Inspection>();
      }
       
       
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
          ISNULL(IP.Color, '#FFFFFF') InspectorColor,
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

        SELECT 
          ISNULL(i.InspReqID, 0) InspReqID,
          P.PermitNo, 
          ISNULL(i.InspectionCode, '') InspectionCode, 
          ISNULL(ir.InsDesc, 'No Inspections') InsDesc, 
          i.InspDateTime, 
          LTRIM(RTRIM(ISNULL(i.ResultADC, ''))) ResultADC,
          i.SchecDateTime SchedDateTime,
	        i.Poster,
          ISNULL(IP.Color, '#FFFFFF') InspectorColor,
          i.Remarks,
          i.Comment,
          ip.name as InspectorName,
          PrivProvIRId PrivateProviderInspectionRequestId
        FROM Permits P
        LEFT OUTER JOIN bpINS_REQUEST i ON P.PermitNo = i.PermitNo
        LEFT OUTER JOIN bpINS_REF ir ON ir.InspCd = i.InspectionCode
        LEFT OUTER JOIN bp_INSPECTORS ip ON i.Inspector = ip.Intl 
        ORDER BY ISNULL(InspDateTime, GETDATE()) DESC, InspReqID DESC";
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

    public static Inspection AddComment(
      int InspectionId,
      string Comment,
      UserAccess ua)
    {
      Comment = Comment.Trim();
      if(ua.current_access == UserAccess.access_type.public_access)
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
          return Inspection.Get(InspectionId);
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
        var current = Get(InspectionId);
        if (current == null)
        {
          return null;
        }

        if (current.Validate(PermitNumber, ResultCode, Remarks, User))
        {
          // let's do some saving
          switch (ResultCode)
          {
            case "A":
            case "P":
            case "N":
            case "C":
            case "":
              if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User))
              {
                current.Errors.Add("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
              }
              break;

            case "D":
              string HoldInput = current.PermitNo + " " + current.InspectionCode + " $35";
              if (!UpdateStatus(InspectionId, ResultCode, current.ResultADC, Remarks, Comments, current.PrivateProviderInspectionRequestId, User, PermitNumber, HoldInput))
              {
                current.Errors.Add("Error saving your changes, please try again. If this message recurs, please contact the helpdesk.");
              }
              break;
          }
        }
        return Inspection.Get(InspectionId);
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

    private bool Validate(string PermitNumber, string ResultCode, string UserRemarks, UserAccess User)
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
          if (User.current_access != UserAccess.access_type.inspector_access)
          {
            Errors.Add("Unauthorized Access.");
            return false;
          }

          if(ResultCode == "A" | ResultCode == "D")
          {
            if(PrivateProviderInspectionRequestId > 0)
            {
              Errors.Add("Private provider inspections must be marked as Not Performed or Performed.");
              return false;
            }
          }

          // If they are trying to change something that was completed before today.
          if (InspDateTime != DateTime.MinValue && InspDateTime.Date < DateTime.Today.Date)
          {
            Errors.Add("Inspections completed prior to Today's date cannot be changed.");
            return false;
          }
          if(ResultCode == "D" & UserRemarks.Length == 0)
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
            if(UserRemarks.Trim().Length == 0 && User.current_access != UserAccess.access_type.public_access)
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
              HldInput = @HoldInput + @Amount
			      WHERE 
              HoldID = @HoldId 
		      END
		    
        INSERT INTO ccCashierItem (NTUser, CatCode, Assoc, AssocKey, BaseFee, Total, Variable, Narrative, HoldID) 
        VALUES (@Poster,'REI',@PermitType,@PermitNumber,@Amount,@Amount,1, @HoldInput, @HoldId)";
      return sql;
    }



  }
}