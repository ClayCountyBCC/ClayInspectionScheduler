using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
  public class NewInspectionController :ApiController
  {
    public IHttpActionResult Save( NewInspection thisInspection )
    {

      List<string> e = thisInspection.Save( Constants.CheckIsExternalUser() );
      return Ok( e );

    }
  }
}
