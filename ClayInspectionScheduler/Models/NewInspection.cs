using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;

namespace InspectionScheduler.Models
{
  public class NewInspection
  {
    public string PermitNo { get; set; } = "";

    public string InspectionCd { get; set; } = "";

    public DateTime SchecDateTime { get; set; } 

    public NewInspection(string PermitNo, string InspectionCd, DateTime SchecDateTime)
    {
      this.PermitNo = PermitNo;
      this.InspectionCd = InspectionCd;
      this.SchecDateTime = SchecDateTime;
    }

    public List<string> Validate( bool IsExternalUser )
    {
      // LET'S GET THE OLD MF PERMIT
      List<string> Errors = new List<string>();
      List<InspType> inspTypes = new List<InspType>();

      var MyCheck = false;
      var Permits = ( from p in Permit.Get( this.PermitNo, IsExternalUser )
                      where p.PermitNo == this.PermitNo
                      select p ).ToList();

      Permit CurrentPermit;
      if( Permits.Count == 0 )
      {
        Errors.Add( "Permit number \"" + PermitNo + "\" was not found." );

        // If permit is not found, then exit
        // no need to validate other data
        return Errors;
      }else
      {
        CurrentPermit = Permits.First();

        // validate user selected date
        if( IsExternalUser )
        {
          foreach(var d in Dates.GenerateShortDates(IsExternalUser, CurrentPermit.SuspendGraceDt ))
          {
            if(d == CurrentPermit.SuspendGraceDt.ToString())
            {
              MyCheck = true;
            }
          }
          if( MyCheck )
          {
            Errors.Add( "Invalid Date Selected" );
          }
        }

        foreach( var i in inspTypes )
        {
          if( i.ToString() == InspectionCd )
          {
            MyCheck = true;
          }
        }
        if( !MyCheck )
        {
          Errors.Add( "Invalid Inspection Type" );
        }
      }

      if( Errors.Count > 0 )
      {
        return Errors;
      }
      else
      {
        Save( IsExternalUser );
        return null;
      }
    }

    public bool Save(bool IsExternalUser)
    {

      if( this.Validate( IsExternalUser ).Count > 0 )return false;


      DateTime selectedDate = DateTime.Parse( this.SchecDateTime.ToShortDateString() );

      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add( "@PermitNo", this.PermitNo );
      dbArgs.Add( "@InspCd", this.InspectionCd );
      dbArgs.Add( "@SelectedDate", selectedDate );
      // this function will save the inspection request.
      string sql = @"
      INSERT INTO bpINS_REQUEST
        ( PermitNo
        , InspectionCode
        , SchecDateTime )
      VALUES
        ( @PermitNo
        , @InspCd
        , @SelectedDate )";

      Constants.Save_Data<string>( sql, dbArgs );

      return true;
      //

    }
  }
}