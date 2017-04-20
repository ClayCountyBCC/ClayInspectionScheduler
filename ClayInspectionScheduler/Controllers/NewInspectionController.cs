using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
    public class NewInspectionController : ApiController
    {
      public IHttpActionResult Post(NewInspection thisInspection )
      {
        var secInspection = new NewInspection();
        secInspection.PermitNo = "23456789";
        secInspection.InspectionCd = "106";
        secInspection.SchecDateTime = "04/25/2017";

        bool lp = NewInspection.Post( secInspection );
        if( !lp )
        {
          return InternalServerError();
        }
        else
        {
          return Ok( lp );
        }

      }
  }
}
