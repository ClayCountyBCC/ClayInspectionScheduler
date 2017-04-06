using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using InspectionScheduler.Models;

namespace InspectionScheduler.Controllers
{
    public class ContractorController : ApiController
    {
    public IHttpActionResult Get( string id)
    {

     List<Contractor> lp = Contractor.Get ( id );

      if (lp == null)
      {
        return InternalServerError ( );
      }
      else
      {
        return Ok ( lp );
      }

    }
  }
}
