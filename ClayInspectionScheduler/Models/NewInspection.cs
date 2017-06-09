using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using Dapper;

namespace InspectionScheduler.Models
{
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; }

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

    public NewInspection(string PermitNo, string InspectionCd, DateTime SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public List<string> Validate(bool IsExternalUser)
    {
      // List of things that need to be validated:
      // 1) Make sure this permit is valid
      // 2) Make sure the date is in the range expected
      // 3) Make sure the inspection type matches the permit type.
      // 4) Make sure the inspection type is a valid inspection type.
      // 5) Make sure the inspection type isn't already scheduled for this permit.

      List<string> Errors = new List<string>();
      List<InspType> inspTypes = (List<InspType>)MyCache.GetItem("inspectiontypes,"+IsExternalUser.ToString());

      var Permits = (from p in Permit.Get(this.PermitNo, IsExternalUser)
                     where p.PermitNo == this.PermitNo
                     select p).ToList();

      Permit CurrentPermit;
      if (Permits.Count == 0)
      {
        Errors.Add("Permit number \"" + PermitNo + "\" was not found.");

        // If permit is not found, then exit
        // no need to validate other data
        return Errors;
      }
      else
      {
        CurrentPermit = Permits.First();

        // validate user selected date

        var start = DateTime.Parse(CurrentPermit.ScheduleDates.First());
        var end = DateTime.Parse(CurrentPermit.ScheduleDates.Last());
        var badDates = (from d in CurrentPermit.ScheduleDates
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

          // TODO: Need to code check inspection type exists on permit
          var e = Inspection.Get(CurrentPermit.PermitNo);
          foreach (var i in e)
          {
            if (i.InspectionCode == this.InspectionCd && i.ResultADC == null)
            {
              Errors.Add("Inspection type exists on permit");
              break;
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
        var i = Constants.Execute(sqlPP, dbArgs);
        if (i)
        {
          IRID = dbArgs.Get<long?>( "@IRID" );
          if( IRID.HasValue )
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

    public List<string> Save(bool IsExternalUser)
    {

      List<string> e = this.Validate(IsExternalUser);

      if (e.Count > 0)
        return e;

      int IRID = this.AddIRID();

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@PermitNo", this.PermitNo);
      dbArgs.Add("@InspCd", this.InspectionCd);
      dbArgs.Add("@SelectedDate", this.SchecDateTime.Date);
      dbArgs.Add("@IRID", (IRID == -1) ? null : IRID.ToString());

      string sql =  $@"
      USE WATSC;      
      insert into bpINS_REQUEST
         (PermitNo,
          InspectionCode,
          SchecDateTime,
          BaseId, 
          PrivProvIRId)
        SELECT TOP 1
          @PermitNo,
          @InspCd,
          CAST(@SelectedDate AS DATE), 
          B.BaseId,
          @IRID
        FROM bpBASE_PERMIT B
        INNER JOIN bpMASTER_PERMIT M ON B.BaseID = M.BaseID
        LEFT OUTER JOIN bpASSOC_PERMIT A ON B.BaseID = A.BaseID AND M.PermitNo = A.MPermitNo
        WHERE (A.PermitNo = @PermitNo OR M.PermitNo = @PermitNo)
      ";


      try
      {
        Constants.Save_Data<string>(sql, dbArgs);

        return e;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return null;
      }



    }


  }

}