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
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; }

    private bool TryingToScheduleFinal { get; set; }

    public string PrivProvFieldName
    {
      get
      {
        switch (this.PermitNo[0])
        {
          case '0':
          case '1':
          case '9':
            return "PrivProvBL";
          case '2':
            return "PrivProvEL";
          case '3':
            return "PrivProvPL";
          case '4':
            return "PrivProvME";
          default:
            return "";
        }
      }
    }

    public string Comment { get; set; }

    public NewInspection(string PermitNo, string InspectionCd, DateTime SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public List<string> Validate(UserAccess.access_type CurrentAccess, List<InspType> inspTypes)
    {
      // List of things that need to be validated:
      // 0) Make sure the permit is able to be scheduled to be inspected.
      // 1) Make sure this permit is valid
      // 2) Make sure the date is in the range expected
      // 3) Make sure the inspection type matches the permit type.
      // 4) Make sure the inspection type is a valid inspection type.
      // 5) Make sure the inspection type isn't already scheduled for this permit.
      // 6) Need to ensure an Inspection cannot be saved if a final inspection result is 'A' or 'P'
      List<string> Errors = new List<string>();

      // 0)
      List<InspType> finals = (from it in inspTypes
                               where it.Final == true
                               select it).ToList();
      foreach (var f in finals)
      {
        if (f.InspCd == this.InspectionCd)
          this.TryingToScheduleFinal = true;
      }
      Console.Write("Finals: ", finals);

      //= (List<InspType>)MyCache.GetItem("inspectiontypes,"+IsExternalUser.ToString());

      var Permits = (from p in Permit.Get(this.PermitNo, CurrentAccess)
                     where p.PermitNo == this.PermitNo
                     select p).ToList();


      Permit CurrentPermit;
      if (Permits.Count == 0)
      {
        Errors.Add($"Permit number {PermitNo} was not found.");

        // If permit is not found, then exit
        // no need to validate other data
        return Errors;
      }
      else
      {
        CurrentPermit = Permits.First();
        if (CurrentPermit.ErrorText.Length > 0)
        {
          Errors.Add(CurrentPermit.ErrorText);
          return Errors;
        }

        // validate user selected date

        var start = DateTime.Parse(CurrentPermit.Dates.minDate_string);
        var end = DateTime.Parse(CurrentPermit.Dates.maxDate_string);
        var badDates = (from d in CurrentPermit.Dates.badDates_string
                        where DateTime.Parse(d) != start &&
                        DateTime.Parse(d) != end
                        select d).ToList<string>();

        // Is the scheduled date between the start and end date?
        if (SchecDateTime.Date < start ||
          SchecDateTime.Date > end)
        {
          Errors.Add("Invalid Date Selected");
        }
        // Is the scheduled date one of the dates they aren't allowed to use?
        if (badDates.Contains(SchecDateTime.ToShortDateString()))
        {
          Errors.Add("Invalid Date Selected");
        }
        // Is the inspection type valid?
        if ((from i in inspTypes
             where i.InspCd == InspectionCd
             select i).Count() == 0)
        {
          Errors.Add("Invalid Inspection Type");
        }
        else
        {
          // Does the inspection type match the permit type
          if (InspectionCd[0] != PermitNo[0])
          {
            Errors.Add("Invalid Inspection for this permit type");
          }


          var inspections = Inspection.Get(CurrentPermit.PermitNo);

          bool electricPassedFinal = false;
          string electricPermitNumber = "";


          if (CurrentPermit.TotalFinalInspections > 0)
          {
            Errors.Add($"Permit #{CurrentPermit.PermitNo} has passed final inspection");
          }

          foreach (var i in inspections)
          {

            if (i.InspectionCode == this.InspectionCd && i.ResultADC == "" && i.PermitNo == CurrentPermit.PermitNo)
            {
              Errors.Add("Inspection type exists on permit");
              break;
            }


            //Adds functionality to return error when saving an inspection for permit that has already passed a final inspection.



            // To schedule a building final: 
            // 1. All fees, including Road impact and school impact fees, must be paid; AND
            // 2. All associated permits must have a final inspection either scheduled, or passed.
            // 3. The Final Building Inspection cannot be scheduled for any time before the latest incomplete
            //    associated permit's final inspection.

            // Currently, this only checks for a passed electric final and charges.



            //foreach (var f in finals)
            //{
            //  if (f.InspCd == this.InspectionCd)
            //  {
            //    if (i.ResultADC == "A" || i.ResultADC == "P")
            //    {
            //      if (CurrentPermit.PermitNo[0] == 2 && !CurrentPermit.NoFinalInspections)
            //      {
            //        electricPassedFinal = true; // Check for Building final inspection scheduling. Electric must passed final and 
            //      }
            //      else
            //      {
            //        electricPermitNumber = CurrentPermit.PermitNo;
            //      }

            //      if (CurrentPermit.ErrorText.Length == 0)
            //      {
            //        Errors.Add($"Permit #{i.PermitNo} has passed final inspection");

            //      }
            //    }
            //  }
            //}
            foreach (var f in finals)
            {

              if (this.InspectionCd == f.InspCd && Errors.Count == 0)
              {
                var charges = Charge.GetCharges(this.PermitNo, true);
                if (charges.Count > 0)
                {
                  Errors.Add($@"Permit #{this.PermitNo} has existing charges preventing a final inspection from being scheduled. 
                              Please contact the Building Department for further assistance.");
                  break;
                }

                if (this.InspectionCd.Trim() == "123" && !electricPassedFinal)
                {
                  Errors.Add($@"Permit #{electricPermitNumber} has not passed final inspection. A Final building Inspection Cannot be scheduled at this time.");
                  break;
                }
              }
            }
          }
        }
        Console.Write(Errors);

      }
      return Errors;
    }

    public int AddIRID()
    {
      // assign string DB fieldname to variable based on permit type;
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      dbArgs.Add("@InspCd", this.InspectionCd);
      dbArgs.Add("@SelectedDate", this.SchecDateTime.Date);
      dbArgs.Add("@IRID", dbType: DbType.Int64, direction: ParameterDirection.Output);

      long? IRID = -1;

      // this function will save the inspection request.
      if (this.PrivProvFieldName.Length == 0) return -1;

      string sqlPP = $@"
        INSERT INTO bpPrivateProviderInsp (BaseId, PermitNo, InspCd, SchedDt)
        SELECT TOP 1
          B.BaseId,
          @PermitNo,
          @InspCd,
          CAST(@SelectedDate AS DATE)
        FROM bpBASE_PERMIT B
        INNER JOIN bpMASTER_PERMIT M ON B.BaseID = M.BaseID
        LEFT OUTER JOIN bpASSOC_PERMIT A ON B.BaseID = A.BaseID AND M.PermitNo = A.MPermitNo
        WHERE M.{this.PrivProvFieldName} = 1
        AND (A.PermitNo = @PermitNo OR M.PermitNo = @PermitNo)

        SET @IRID = SCOPE_IDENTITY();";
      try
      {
        var i = Constants.Exec_Query(sqlPP, dbArgs);
        if (i > -1)
        {
          IRID = dbArgs.Get<long?>("@IRID");
          if (IRID != null)
          {
            return (int)IRID.Value;
          }
          else
          {
            return -1;
          }
        }
        else
        {
          return -1;

        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex, sqlPP);
        return -1;
      }
    }

    public List<string> Save(UserAccess ua)
    {
      List<InspType> inspTypes = InspType.GetCachedInspectionTypes();
      List<string> errors = this.Validate(ua.current_access, inspTypes);

      if (errors.Count > 0)
        return errors;

      int IRID = this.AddIRID();
      string InitialComment = "Inspection Request created.";

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      dbArgs.Add("@InspCd", this.InspectionCd);
      dbArgs.Add("@SelectedDate", this.SchecDateTime.Date);
      dbArgs.Add("@Username", ua.user_name.Trim(), dbType: DbType.String, size: 7);
      dbArgs.Add("@DisplayName", ua.display_name);
      dbArgs.Add("@IRID", (IRID == -1) ? null : IRID.ToString());
      dbArgs.Add("@InitialComment", InitialComment);
      dbArgs.Add("@Comment", Comment);
      dbArgs.Add("@SavedInspectionID", -1, dbType: DbType.Int32, direction: ParameterDirection.Output, size: 8);

      string sql = $@"
      USE WATSC;     

      INSERT INTO bpINS_REQUEST
          (PermitNo,
          InspectionCode,
          SchecDateTime,
          ReqDateTime,
          BaseId,
          ReceivedBy,
          PrivProvIRId)
      SELECT TOP 1
          @PermitNo,
          @InspCd,
          CAST(@SelectedDate AS DATE), 
          GETDATE(),
          B.BaseId,
          @Username,
          @IRID
      FROM bpBASE_PERMIT B
      LEFT OUTER JOIN bpMASTER_PERMIT M ON M.BaseID = B.BaseID
      LEFT OUTER JOIN bpASSOC_PERMIT A ON B.BaseID = A.BaseID
      WHERE (A.PermitNo = @PermitNo OR M.PermitNo = @PermitNo)

      SET @SavedInspectionID = SCOPE_IDENTITY();

      EXEC add_inspection_comment @DisplayName, @SavedInspectionID, @InitialComment, @Comment;";
      try
      {
        //bool isFinal = (from it in inspTypes
        //                where it.InspCd == this.InspectionCd
        //                select it.Final).First();
        //Console.WriteLine("isFinal:", isFinal);


        var i = Constants.Exec_Query(sql, dbArgs);
        if (i > -1)
        {
          int SavedInspectionId = dbArgs.Get<int>("@SavedInspectionID");
          string inspDesc = (from it in inspTypes
                             where it.InspCd == this.InspectionCd
                             select it.InsDesc).First();
          errors.Add(inspDesc + " inspection has been scheduled for permit #" + this.PermitNo + ", on " + this.SchecDateTime.ToShortDateString() + ". This was saved with request id " + SavedInspectionId + ".");
        }
        else
        {
          errors.Add("No Record Saved, Please Try again. Contact the Building department if issues persist.");
        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        errors.Add("No Record Saved, Please Try again. Contact the Building department if issues persist.");
      }
      return errors;


    }


  }

}