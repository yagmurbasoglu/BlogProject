using System.Linq.Expressions;
using BlogProject.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogProject.Persistence.Repository;

public class EfRepository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _ctx;
    private readonly DbSet<T> _set;

    public EfRepository(AppDbContext ctx)
    {
        _ctx = ctx;
        _set = ctx.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, bool asNoTracking = true, CancellationToken ct = default)
    {
        IQueryable<T> query = asNoTracking ? _set.AsNoTracking() : _set;
        return await query.FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id, ct);
    }

    public async Task<List<T>> ListAsync(Expression<Func<T, bool>>? filter = null,
                                         bool asNoTracking = true,
                                         CancellationToken ct = default)
    {
        IQueryable<T> query = asNoTracking ? _set.AsNoTracking() : _set;
        if (filter is not null) query = query.Where(filter);
        return await query.ToListAsync(ct);
    }

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> filter,
                                              Func<IQueryable<T>, IQueryable<T>>? include = null,
                                              bool asNoTracking = true,
                                              CancellationToken ct = default)
    {
        IQueryable<T> query = asNoTracking ? _set.AsNoTracking() : _set;
        if (include is not null) query = include(query);
        return await query.FirstOrDefaultAsync(filter, ct);
    }

    public async Task AddAsync(T entity, CancellationToken ct = default) => await _set.AddAsync(entity, ct);
    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default) => await _set.AddRangeAsync(entities, ct);
    public void Update(T entity) => _set.Update(entity);
    public void Remove(T entity) => _set.Remove(entity);

    public void SoftDelete(T entity)
    {
        var isDeletedProp = entity.GetType().GetProperty("IsDeleted");
        var deletedAtProp = entity.GetType().GetProperty("DeletedAtUtc");

        if (isDeletedProp is not null)
        {
            isDeletedProp.SetValue(entity, true);
            deletedAtProp?.SetValue(entity, DateTime.UtcNow);
            _set.Update(entity);
        }
        else
        {
            _set.Remove(entity);
        }
    }
}
