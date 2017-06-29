using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayInspectionScheduler.Models;

namespace ClayInspectionScheduler.Controllers
{
  public class ValidatePermitController : ApiController
  {
    // GET: api/ValidatePermit/Permitnumber
    public string Get(string permitNo)
    {
      return Permit.Validate(permitNo, Constants.CheckIsExternalUser(User.Identity.Name));
    }

  }
}
