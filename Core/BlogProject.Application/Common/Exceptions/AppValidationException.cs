using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BlogProject.Application.Common.Exceptions
{
    public class AppValidationException : Exception
    {
        public AppValidationException(string message) : base(message) { }
    }
}
