using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace BlogProject.Application.Interfaces
{
    public interface IRepository<T> where T : class
    {
        // Get by primary key
        Task<T?> GetByIdAsync(Guid id, bool asNoTracking = true, CancellationToken ct = default);

        // List with optional filter
        Task<List<T>> ListAsync(Expression<Func<T, bool>>? filter = null,
                                bool asNoTracking = true,
                                CancellationToken ct = default);

        // Query with includes (örneğin Post + Comments + Likes)
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> filter,
                                     Func<IQueryable<T>, IQueryable<T>>? include = null,
                                     bool asNoTracking = true,
                                     CancellationToken ct = default);

        // CRUD
        Task AddAsync(T entity, CancellationToken ct = default);
        Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default);

        void Update(T entity);
        void Remove(T entity);

        void SoftDelete(T entity);
    }
}
